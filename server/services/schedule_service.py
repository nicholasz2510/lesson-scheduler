from __future__ import annotations

import json
import re
from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, Iterable as TypingIterable, List, Optional, Sequence, Set, Tuple

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from extensions import db
from models.models import Availability, FinalizedSchedule, Schedule, Student


def get_all_schedules() -> List[Schedule]:
    return Schedule.query.all()


@dataclass(frozen=True)
class ScheduledLesson:
    """Result object representing a scheduled lesson."""

    student_id: int
    student_name: str
    start_time: datetime
    end_time: datetime
    day: date


class _Edge:
    __slots__ = ("to", "rev", "cap", "cost", "metadata")

    def __init__(self, to: int, rev: int, cap: int, cost: int, metadata: Optional[Tuple] = None):
        self.to = to
        self.rev = rev
        self.cap = cap
        self.cost = cost
        self.metadata = metadata


class _MinCostFlow:
    def __init__(self, node_count: int):
        self._n = node_count
        self._graph: List[List[_Edge]] = [[] for _ in range(node_count)]

    @property
    def graph(self) -> List[List[_Edge]]:
        return self._graph

    def add_edge(
        self,
        u: int,
        v: int,
        capacity: int,
        cost: int,
        metadata: Optional[Tuple] = None,
    ) -> Tuple[int, int]:
        forward = _Edge(v, len(self._graph[v]), capacity, cost, metadata)
        backward = _Edge(u, len(self._graph[u]), 0, -cost, metadata)
        self._graph[u].append(forward)
        self._graph[v].append(backward)
        return u, len(self._graph[u]) - 1

    def successive_shortest_path(
        self,
        source: int,
        sink: int,
        max_flow: int,
        day_states: Dict[date, "_DayState"],
        *,
        on_assign=None,
    ) -> Tuple[int, int]:
        import heapq

        flow = 0
        cost = 0
        potential = [0] * self._n
        inf = 10**18

        while flow < max_flow:
            dist = [inf] * self._n
            prev_node = [-1] * self._n
            prev_edge = [-1] * self._n
            dist[source] = 0
            heap: List[Tuple[int, int]] = [(0, source)]

            while heap:
                cur_dist, u = heapq.heappop(heap)
                if cur_dist != dist[u]:
                    continue
                for idx, edge in enumerate(self._graph[u]):
                    if edge.cap <= 0:
                        continue
                    next_cost = cur_dist + edge.cost + potential[u] - potential[edge.to]
                    if next_cost < dist[edge.to]:
                        dist[edge.to] = next_cost
                        prev_node[edge.to] = u
                        prev_edge[edge.to] = idx
                        heapq.heappush(heap, (next_cost, edge.to))

            if dist[sink] == inf:
                break

            for node in range(self._n):
                if dist[node] < inf:
                    potential[node] += dist[node]

            add_flow = max_flow - flow
            v = sink
            path: List[Tuple[int, int]] = []
            while v != source:
                u = prev_node[v]
                edge_index = prev_edge[v]
                if u == -1 or edge_index == -1:
                    add_flow = 0
                    break
                edge = self._graph[u][edge_index]
                add_flow = min(add_flow, edge.cap)
                path.append((u, edge_index))
                v = u

            if add_flow <= 0:
                break

            flow += add_flow
            cost += add_flow * potential[sink]

            days_seen: Dict[date, bool] = {}
            open_edges: Dict[date, bool] = {}

            for u, edge_index in path:
                edge = self._graph[u][edge_index]
                reverse = self._graph[edge.to][edge.rev]
                edge.cap -= add_flow
                reverse.cap += add_flow

                if edge.metadata:
                    marker = edge.metadata[0]
                    if marker == "day_slot":
                        day_key: date = edge.metadata[1]
                        days_seen[day_key] = True
                    elif marker == "open":
                        day_key = edge.metadata[1]
                        open_edges[day_key] = True
                    elif marker == "slot_student" and on_assign is not None:
                        on_assign(edge.metadata, add_flow)

            for day_key in days_seen.keys():
                state = day_states[day_key]
                state.assignments_made += add_flow
                remaining = max(0, state.total_slots - state.assignments_made)
                if not state.opened and day_key in open_edges:
                    state.opened = True
                    through_u, through_idx = state.through_edge
                    self._graph[through_u][through_idx].cap = remaining
                    open_u, open_idx = state.open_edge
                    open_forward = self._graph[open_u][open_idx]
                    open_reverse = self._graph[open_forward.to][open_forward.rev]
                    open_reverse.cap = 0
                elif state.opened:
                    through_u, through_idx = state.through_edge
                    current_cap = self._graph[through_u][through_idx].cap
                    if current_cap > remaining:
                        self._graph[through_u][through_idx].cap = remaining

        return flow, cost


@dataclass
class _DayState:
    total_slots: int
    open_edge: Tuple[int, int]
    through_edge: Tuple[int, int]
    opened: bool = False
    assignments_made: int = 0


def generate_schedule(
    schedule_id: int,
    *,
    slot_minutes: Optional[int] = None,
    buffer_minutes: int = 0,
    day_open_cost: int = 10_000,
    gap_penalty: int = 5,
    teacher_id: Optional[int] = None,
) -> Dict[str, TypingIterable]:
    """Generate a lesson schedule using a min-cost max-flow model."""

    schedule: Optional[Schedule] = Schedule.query.get(schedule_id)
    if schedule is None:
        raise LookupError("Schedule not found.")

    if teacher_id is not None and schedule.teacher_id != teacher_id:
        raise PermissionError('Teacher is not authorized for this schedule.')

    students: Sequence[Student] = schedule.students
    if not students:
        return {"lessons": [], "unscheduled_student_ids": []}

    lesson_lengths = {student.lesson_length for student in students}
    inferred_slot_minutes: Optional[int] = slot_minutes
    if inferred_slot_minutes is None:
        if len(lesson_lengths) != 1:
            raise ValueError(
                "slot_minutes must be provided when students have differing lesson lengths"
            )
        inferred_slot_minutes = lesson_lengths.pop()
    else:
        if any(length % inferred_slot_minutes != 0 for length in lesson_lengths):
            raise ValueError(
                "All students must have lesson lengths that are multiples of slot_minutes"
            )

    if inferred_slot_minutes <= 0:
        raise ValueError("slot_minutes must be positive")
    if buffer_minutes < 0:
        raise ValueError("buffer_minutes must be non-negative")

    slots_required_by_student: Dict[int, int] = {
        student.id: max(1, student.lesson_length // inferred_slot_minutes)
        for student in students
    }

    teacher_slots = _collect_teacher_slots(schedule, schedule.teacher_id)
    if not teacher_slots:
        return {
            "lessons": [],
            "unscheduled_student_ids": [student.id for student in students],
        }

    student_slots = _collect_student_slots(schedule.availabilities)

    student_by_id: Dict[int, Student] = {student.id: student for student in students}
    schedule_days = _parse_schedule_days(schedule.days or schedule.dates)

    day_slot_map: Dict[date, List[int]] = {}
    slot_metadata: Dict[int, Tuple[date, datetime, int]] = {}
    slot_students: Dict[int, List[Tuple[int, Tuple[int, ...]]]] = {}
    slot_counter = 0

    for day_key in sorted(teacher_slots.keys()):
        if schedule_days and day_key not in schedule_days:
            continue

        teacher_times = sorted(teacher_slots[day_key])
        day_slots: List[int] = []

        for position, start_time in enumerate(teacher_times):
            candidates: List[Tuple[int, Tuple[int, ...]]] = []
            for student_id in student_by_id.keys():
                availability = student_slots.get(student_id, set())
                if start_time not in availability:
                    continue
                required_slots = slots_required_by_student.get(student_id, 1)
                extra_slots: List[int] = []
                if required_slots > 1:
                    day_slots_for_teacher = teacher_times
                    ok = True
                    for offset in range(1, required_slots):
                        next_index = position + offset
                        if next_index >= len(day_slots_for_teacher):
                            ok = False
                            break
                        expected_time = start_time + timedelta(
                            minutes=offset * inferred_slot_minutes
                        )
                        next_start_time = day_slots_for_teacher[next_index]
                        if next_start_time != expected_time:
                            ok = False
                            break
                        if expected_time not in availability:
                            ok = False
                            break
                    if not ok:
                        continue

                    # Map the teacher slot positions to slot identifiers if they exist later.
                    extra_ids: List[int] = []
                    for offset in range(1, required_slots):
                        next_index = position + offset
                        # We'll map after slots are created; placeholder for now.
                        extra_ids.append(-1)
                    extra_slots = extra_ids

                candidates.append((student_id, tuple(extra_slots)))

            if not candidates:
                continue

            slot_id = slot_counter
            slot_counter += 1
            slot_metadata[slot_id] = (day_key, start_time, position)
            slot_students[slot_id] = candidates
            day_slots.append(slot_id)

        if day_slots:
            day_slot_map[day_key] = day_slots

    if not day_slot_map:
        return {
            "lessons": [],
            "unscheduled_student_ids": [student.id for student in students],
        }

    invalid_slots: Set[int] = set()
    for slot_id, (day_key, start_time, position) in list(slot_metadata.items()):
        candidates = slot_students.get(slot_id, [])
        if not candidates:
            invalid_slots.add(slot_id)
            continue

        updated_candidates: List[Tuple[int, Tuple[int, ...]]] = []
        day_slots = day_slot_map.get(day_key, [])
        for student_id, _extra in candidates:
            required_slots = slots_required_by_student.get(student_id, 1)
            if required_slots <= 1:
                updated_candidates.append((student_id, tuple()))
                continue

            availability = student_slots.get(student_id, set())
            new_extra: List[int] = []
            ok = True
            for offset in range(1, required_slots):
                next_index = position + offset
                if next_index >= len(day_slots):
                    ok = False
                    break
                next_slot_id = day_slots[next_index]
                next_day, next_start_time, _ = slot_metadata[next_slot_id]
                if next_day != day_key:
                    ok = False
                    break
                expected_time = start_time + timedelta(minutes=offset * inferred_slot_minutes)
                if next_start_time != expected_time:
                    ok = False
                    break
                if expected_time not in availability:
                    ok = False
                    break
                new_extra.append(next_slot_id)

            if ok:
                updated_candidates.append((student_id, tuple(new_extra)))

        if updated_candidates:
            slot_students[slot_id] = updated_candidates
        else:
            invalid_slots.add(slot_id)

    if invalid_slots:
        for slot_id in invalid_slots:
            slot_metadata.pop(slot_id, None)
            slot_students.pop(slot_id, None)

        for day_key, day_slots in list(day_slot_map.items()):
            filtered = [slot_id for slot_id in day_slots if slot_id not in invalid_slots]
            if filtered:
                day_slot_map[day_key] = filtered
            else:
                day_slot_map.pop(day_key, None)

    if not day_slot_map:
        return {
            "lessons": [],
            "unscheduled_student_ids": [student.id for student in students],
        }

    source = 0
    day_nodes: Dict[date, int] = {}
    slot_nodes: Dict[int, int] = {}
    student_nodes: Dict[int, int] = {}

    node_cursor = 1
    for day_key in day_slot_map:
        day_nodes[day_key] = node_cursor
        node_cursor += 1

    for slot_id in slot_metadata:
        slot_nodes[slot_id] = node_cursor
        node_cursor += 1

    for student_id in student_by_id:
        student_nodes[student_id] = node_cursor
        node_cursor += 1

    sink = node_cursor
    solver = _MinCostFlow(sink + 1)

    day_states: Dict[date, _DayState] = {}
    day_slot_edges: Dict[int, Tuple[int, int]] = {}

    for day_key, day_node in day_nodes.items():
        open_edge = solver.add_edge(
            source,
            day_node,
            1,
            day_open_cost,
            metadata=("open", day_key),
        )
        through_edge = solver.add_edge(
            source,
            day_node,
            0,
            0,
            metadata=("throughput", day_key),
        )
        day_states[day_key] = _DayState(
            total_slots=len(day_slot_map[day_key]),
            open_edge=open_edge,
            through_edge=through_edge,
        )

    slot_edges_by_slot: Dict[int, List[Tuple[int, int]]] = defaultdict(list)
    slot_to_student_edges: List[Tuple[int, int, int, int, Tuple[int, ...]]] = []

    for slot_id, (day_key, start_time, position) in slot_metadata.items():
        candidates = slot_students.get(slot_id, [])
        if not candidates:
            continue
        day_node = day_nodes[day_key]
        slot_node = slot_nodes[slot_id]
        gap_cost = gap_penalty * position * position
        day_edge = solver.add_edge(
            day_node,
            slot_node,
            1,
            gap_cost,
            metadata=("day_slot", day_key, slot_id),
        )
        day_slot_edges[slot_id] = day_edge

        for student_id, extra_slots in candidates:
            person_node = student_nodes[student_id]
            required_slots = slots_required_by_student.get(student_id, 1)
            bonus_cost = 0
            if required_slots > 1 and extra_slots:
                for extra_slot_id in extra_slots:
                    if extra_slot_id < 0:
                        continue
                    extra_meta = slot_metadata.get(extra_slot_id)
                    if not extra_meta:
                        continue
                    _extra_day, _extra_start, extra_position = extra_meta
                    bonus_cost += gap_penalty * (extra_position * extra_position)
                # Slightly prefer longer contiguous lessons when costs tie.
                bonus_cost += -1 * len(extra_slots)
            edge_ref = solver.add_edge(
                slot_node,
                person_node,
                1,
                bonus_cost,
                metadata=("slot_student", slot_id, student_id, extra_slots),
            )
            slot_edges_by_slot[slot_id].append((edge_ref[0], edge_ref[1]))
            slot_to_student_edges.append(
                (slot_id, student_id, edge_ref[0], edge_ref[1], extra_slots)
            )

    for student_id, node in student_nodes.items():
        solver.add_edge(node, sink, 1, 0, metadata=("student_sink", student_id))

    target_flow = len(student_by_id)
    blocked_slots: Set[int] = set()

    def handle_assignment(metadata: Tuple, flow_amount: int) -> None:
        if flow_amount <= 0:
            return
        marker = metadata[0] if metadata else None
        if marker != "slot_student":
            return
        slot_id, _student_id, extra_slots = metadata[1], metadata[2], metadata[3]
        extra_slots = tuple(extra_slots or ())
        base_slot_meta = slot_metadata.get(slot_id)
        if base_slot_meta is None:
            return
        day_key, _start_time, _position = base_slot_meta
        if extra_slots:
            for extra_slot_id in extra_slots:
                if extra_slot_id in blocked_slots:
                    continue
                blocked_slots.add(extra_slot_id)
                if extra_slot_id in day_slot_edges:
                    day_u, day_index = day_slot_edges[extra_slot_id]
                    day_edge = solver.graph[day_u][day_index]
                    day_edge.cap = 0
                    reverse_edge = solver.graph[day_edge.to][day_edge.rev]
                    reverse_edge.cap = 0
                for edge_u, edge_index in slot_edges_by_slot.get(extra_slot_id, []):
                    edge = solver.graph[edge_u][edge_index]
                    edge.cap = 0
                    reverse = solver.graph[edge.to][edge.rev]
                    reverse.cap = 0

        block_size = 1 + len(extra_slots)
        if block_size > 1:
            state = day_states.get(day_key)
            if state is not None:
                state.assignments_made += (block_size - 1) * flow_amount
                remaining = max(0, state.total_slots - state.assignments_made)
                through_u, through_idx = state.through_edge
                current_cap = solver.graph[through_u][through_idx].cap
                if current_cap > remaining:
                    solver.graph[through_u][through_idx].cap = remaining

    flow, total_cost = solver.successive_shortest_path(
        source,
        sink,
        target_flow,
        day_states,
        on_assign=handle_assignment,
    )

    potential_assignments: List[
        Tuple[int, date, datetime, int, int, Tuple[int, ...], Student]
    ] = []

    for slot_id, student_id, edge_u, edge_index, extra_slots in slot_to_student_edges:
        edge = solver.graph[edge_u][edge_index]
        if edge.cap != 0:
            continue

        day_key, start_time, _position = slot_metadata[slot_id]
        student = student_by_id[student_id]
        required_slots = slots_required_by_student.get(student_id, 1)
        potential_assignments.append(
            (
                required_slots,
                day_key,
                start_time,
                slot_id,
                student_id,
                extra_slots,
                student,
            )
        )

    potential_assignments.sort(
        key=lambda item: (
            -item[0],
            item[1],
            item[2],
            item[6].name,
        )
    )

    lessons: List[ScheduledLesson] = []
    assigned_student_ids: Set[int] = set()
    occupied_slots: Set[int] = set()

    for required_slots, day_key, start_time, slot_id, student_id, extra_slots, student in potential_assignments:
        needed_slots = (slot_id,) + tuple(extra_slots or ())
        if any(slot in occupied_slots for slot in needed_slots):
            continue

        for slot in needed_slots:
            occupied_slots.add(slot)

        assigned_student_ids.add(student_id)
        lessons.append(
            ScheduledLesson(
                student_id=student.id,
                student_name=student.name,
                start_time=start_time,
                end_time=start_time
                + timedelta(minutes=student.lesson_length + buffer_minutes),
                day=day_key,
            )
        )

    lessons.sort(key=lambda lesson: (lesson.day, lesson.start_time, lesson.student_name))
    unscheduled = [student.id for student in students if student.id not in assigned_student_ids]

    lessons_payload = [
        {
            "student_id": lesson.student_id,
            "student_name": lesson.student_name,
            "start_time": lesson.start_time.isoformat(),
            "end_time": lesson.end_time.isoformat(),
            "day": lesson.day.isoformat(),
        }
        for lesson in lessons
    ]

    return {
        "lessons": lessons_payload,
        "unscheduled_student_ids": unscheduled,
        "scheduled_count": flow,
        "objective_cost": total_cost,
    }


def _parse_schedule_days(days_raw: Optional[TypingIterable] = None) -> Set[date]:
    if not days_raw:
        return set()

    if isinstance(days_raw, (list, tuple, set)):
        values: TypingIterable = days_raw
    else:
        try:
            decoded = json.loads(days_raw)
            if isinstance(decoded, list):
                values = decoded
            else:
                values = str(days_raw).split(",")
        except (json.JSONDecodeError, TypeError):
            values = str(days_raw).split(",")

    parsed: Set[date] = set()
    for value in values:
        if value is None:
            continue
        parsed.add(_coerce_date(value))
    return parsed


def _coerce_date(value) -> date:
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(str(value)).date()


def _collect_teacher_slots(schedule: Schedule, teacher_id: Optional[int]) -> Dict[date, List[datetime]]:
    slots: Dict[date, List[datetime]] = defaultdict(list)
    for availability in schedule.availabilities:
        if availability.teacher_id is None:
            continue
        if teacher_id is not None and availability.teacher_id != teacher_id:
            continue
        start_time = availability.start_time
        slots[start_time.date()].append(start_time)
    return slots


def _collect_student_slots(availabilities: TypingIterable[Availability]) -> Dict[int, Set[datetime]]:
    student_slots: Dict[int, Set[datetime]] = defaultdict(set)
    for availability in availabilities:
        if availability.student_id is None:
            continue
        student_slots[availability.student_id].add(availability.start_time)
    return student_slots


def _slugify(value: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', (value or '').lower()).strip('-')
    return base or 'schedule'


def _ensure_unique_slug(slug: str, schedule_id: Optional[int] = None) -> str:
    base = slug
    counter = 1
    while True:
        query = Schedule.query.filter(Schedule.slug == slug)
        if schedule_id is not None:
            query = query.filter(Schedule.id != schedule_id)
        if query.first() is None:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def list_teacher_schedules(teacher_id: int) -> List[Schedule]:
    return (
        Schedule.query.options(
            joinedload(Schedule.students),
            joinedload(Schedule.availabilities),
        )
        .filter_by(teacher_id=teacher_id)
        .order_by(Schedule.created_at.desc())
        .all()
    )


def get_schedule(schedule_id: int, teacher_id: Optional[int] = None) -> Optional[Schedule]:
    query = Schedule.query.options(
        joinedload(Schedule.students),
        joinedload(Schedule.availabilities),
        joinedload(Schedule.finalized_entries),
    ).filter_by(id=schedule_id)

    if teacher_id is not None:
        query = query.filter_by(teacher_id=teacher_id)

    return query.first()


def get_schedule_by_slug(slug: str) -> Optional[Schedule]:
    return (
        Schedule.query.options(
            joinedload(Schedule.students),
            joinedload(Schedule.availabilities),
        )
        .filter_by(slug=slug)
        .first()
    )


def create_schedule(data: dict, teacher_id: int) -> Schedule:
    title = (data.get('title') or '').strip()
    if not title:
        raise ValueError('Title is required.')

    dates_value = data.get('dates') or []
    if not isinstance(dates_value, Iterable):
        raise ValueError('At least one date is required.')

    dates_list = list(dates_value)
    if not dates_list:
        raise ValueError('At least one date is required.')

    start_time = data.get('start_time')
    end_time = data.get('end_time')

    incoming_slug = data.get('slug') or _slugify(title)
    slug = _ensure_unique_slug(incoming_slug)

    student_payloads = data.get('students') or []
    seen_student_names = set()
    for student_payload in student_payloads:
        name = (student_payload.get('name') or '').strip()
        if not name:
            raise ValueError('Student names cannot be empty.')

        normalized = name.lower()
        if normalized in seen_student_names:
            raise ValueError(f'Duplicate student name: {name}')
        seen_student_names.add(normalized)

    schedule = Schedule(
        title=title,
        slug=slug,
        start_time=start_time,
        end_time=end_time,
        teacher_id=teacher_id,
    )
    schedule.dates = dates_list

    try:
        db.session.add(schedule)
        db.session.flush()

        for student_payload in student_payloads:
            name = (student_payload.get('name') or '').strip()
            lesson_length = student_payload.get('lesson_length') or 30
            try:
                lesson_length = int(lesson_length)
            except (TypeError, ValueError):
                lesson_length = 30

            student = Student(
                name=name,
                lesson_length=lesson_length,
                schedule_id=schedule.id,
            )
            db.session.add(student)

        db.session.commit()
        return get_schedule(schedule.id, teacher_id)
    except Exception:
        db.session.rollback()
        raise


def update_schedule(schedule_id: int, teacher_id: int, data: dict) -> Schedule:
    schedule = get_schedule(schedule_id, teacher_id)
    if schedule is None:
        raise LookupError('Schedule not found.')

    if 'title' in data:
        title = (data.get('title') or '').strip()
        if not title:
            raise ValueError('Title cannot be empty.')
        schedule.title = title

    if 'dates' in data:
        dates_value = data.get('dates') or []
        if not isinstance(dates_value, Iterable):
            raise ValueError('At least one date is required.')

        dates_list = list(dates_value)
        if not dates_list:
            raise ValueError('At least one date is required.')
        schedule.dates = dates_list

    if 'start_time' in data:
        schedule.start_time = data.get('start_time')

    if 'end_time' in data:
        schedule.end_time = data.get('end_time')

    if 'slug' in data and data['slug']:
        new_slug = _ensure_unique_slug(data['slug'], schedule_id=schedule.id)
        schedule.slug = new_slug

    try:
        db.session.commit()
        return get_schedule(schedule.id, teacher_id)
    except IntegrityError:
        db.session.rollback()
        raise ValueError('Schedule slug must be unique.')
    except Exception:
        db.session.rollback()
        raise


def delete_schedule(schedule_id: int, teacher_id: int) -> None:
    schedule = get_schedule(schedule_id, teacher_id)
    if schedule is None:
        raise LookupError('Schedule not found.')

    try:
        db.session.delete(schedule)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def _parse_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace('Z', '+00:00')
        try:
            return datetime.fromisoformat(normalized)
        except ValueError as exc:
            raise ValueError(f'Invalid datetime value: {value}') from exc
    raise ValueError('Datetime value is required.')


def finalize_schedule(schedule_id: int, teacher_id: int, entries: List[dict]) -> Schedule:
    schedule = get_schedule(schedule_id, teacher_id)
    if schedule is None:
        raise LookupError('Schedule not found.')

    if not isinstance(entries, list) or not entries:
        raise ValueError('Finalized entries are required.')

    try:
        FinalizedSchedule.query.filter_by(schedule_id=schedule.id).delete()

        for entry in entries:
            student_id = entry.get('student_id')
            if not student_id:
                raise ValueError('Each finalized entry requires a student_id.')

            student = Student.query.filter_by(id=student_id, schedule_id=schedule.id).first()
            if student is None:
                raise ValueError('Student does not belong to this schedule.')

            start_time = _parse_datetime(entry.get('start_time'))
            end_time = _parse_datetime(entry.get('end_time'))

            record = FinalizedSchedule(
                schedule_id=schedule.id,
                student_id=student.id,
                teacher_id=teacher_id,
                start_time=start_time,
                end_time=end_time,
            )
            db.session.add(record)

        schedule.is_finalized = True
        schedule.finalized_at = datetime.utcnow()
        db.session.commit()
        return get_schedule(schedule.id, teacher_id)
    except Exception:
        db.session.rollback()
        raise
