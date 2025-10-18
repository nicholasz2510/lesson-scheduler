import PropTypes from "prop-types";

export function MenuIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DotsVerticalIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 6.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

MenuIcon.propTypes = {
  className: PropTypes.string,
};

MenuIcon.defaultProps = {
  className: undefined,
};

DotsVerticalIcon.propTypes = {
  className: PropTypes.string,
};

DotsVerticalIcon.defaultProps = {
  className: undefined,
};
