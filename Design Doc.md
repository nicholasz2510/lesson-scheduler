# Lesson Scheduler

This design doc may not be up-to-date. The most recent version of this doc is [here](https://docs.google.com/document/d/1PoxgVqALvJT-DO7nnKTv0Prb-RQf93u2W143U1D_ocM/edit?usp=sharing).

[Overview](#overview)

[Motivation](#motivation)

[Design](#design)

[UX inspirations](#ux-inspirations)

[Client](#client)

[Server](#server)

[Scheduling Algorithm](#scheduling-algorithm)

[Logistics](#logistics)

[Business](#business)

[LINK TO DUBHACKS HACKER GUIDE](#link-to-dubhacks-hacker-guide)

# 

# Overview {#overview}

Let’s build a web app to help music teachers schedule lessons and studio class with their students.

# Motivation {#motivation}

Music teachers utilize many different “old-school” systems (pen and paper, or everyone emails their availability every week) for scheduling lessons and classes. There are existing general-purpose scheduling tools, but most of these are meant for finding a singular common time for *everyone* to meet (e.g. when2meet). Ones that are built for 1:1s or appointments also don’t take into account most of the special considerations for music lesson scheduling. The goal is to provide an application focused on our use case, taking into account the specific considerations involved with scheduling music lessons. 

# Design {#design}

## UX inspirations {#ux-inspirations}

When2meet style scheduler:

I think we should do something like this but quantize to 30 minutes rather than 15 minutes, because I think the UW room reservation system quantizes this way (e.g. reserve 2-2:30, 2:30-3, etc.). Also the shortest lessons getting scheduled are 30 min anyway.

## Client {#client}

MVP (Minimum Viable Product) Workflow

* Teacher view:  
  * Teacher should sign in  
  * Home page: a dashboard showing previously created schedules with options to   
  * Create a schedule (with title)  
  * Choose dates that will go in the schedule  
  * Go to a main screen for this schedule, containing  
    * a when2meet style scheduler to choose available times on the dates  
    * a sidebar to enter names of students and the length of their lesson. (the lengths are commonly 30 minutes or 1 hour, so these could just be buttons. 1 hour can be selected by default.) Students that have been entered have a checkbox “Submitted?” next to their name to designate if they have filled their schedules yet.  
    * a share link  
    * a “Schedule\!” button  
  * (uses the share link to share this scheduler with students)  
  * (students each fill out their availability)  
  * The prof can press the “Schedule\!” button to create a view of when everyone’s lessons can be. If they are unhappy with some aspect (e.g. too many lessons in a row without a break), they can edit their own availability to be unavailable for some interval for a break, then try “Schedule\!” again  
  * We should have some mechanism for the prof to distribute the assigned times once they’re ready  
* Student view:  
  * Click on link shared by professor  
  * A grid of the student names entered by the professor shows up. The student clicks on their name  
  * Go to a main screen for this schedule, containing  
    * a when2meet style scheduler to choose available times on the dates  
    * a “submit” button  
  * (TODO: how should students discover/be notified of their final assigned time after the prof finalizes?)

Non-MVP ideas

* Schedule combined studio class with everyone alongside lessons per-person  
* Integrate with Google Calendar to overlay and show availability (see: Timeful)  
* ability to have template schedulers so you can have like a single week’s template containing dates, and names, and then you can copy that every week  
* Integrate AI for one of the side tracks

Tech stack

* Browser  
  * JS  
    * React  
  * HTML/CSS  
    * Bootstrap  
    * [https://www.freecodecamp.org/news/how-to-turn-your-website-into-a-mobile-app-with-7-lines-of-json-631c9c9895f5/](https://www.freecodecamp.org/news/how-to-turn-your-website-into-a-mobile-app-with-7-lines-of-json-631c9c9895f5/)  
* Android  
  * WebView of the website (so the website would need to already scale well)  
* iOS  
  * some equivalent of WebView

## Server {#server}

MVP Workflow

* Accepts requests from client (prof) to create new scheduler  
  * Fields:  
    * title  
    * URL (generated from title?)  
* Each time a person updates their availability, send post request to store that availability as some data structure  
* when the prof presses “Schedule\!”, run the scheduling algorithm on the server side and send it back to the client  
  * Algorithm:   
    * inputs: everyone’s availability  
    * output: a schedule to get everyone a lesson  
    * details below

Non-MVP ideas

* 

Tech stack

* Server  
  * Python (Flask)  
* Storage  
  * MySQL (writing is better)  
* Hosting  
  * AWS  
    * [https://dubhacks.notion.site/Free-Products-for-Hacking-251ff32c1d7e81c89099fbce67eaae47](https://dubhacks.notion.site/Free-Products-for-Hacking-251ff32c1d7e81c89099fbce67eaae47)  
    * AWS providing Cloud Credits to all participants

## Scheduling Algorithm {#scheduling-algorithm}

* Goals to optimize:  
  * Minimize the number of days needed to teach  
  * Maximize back-to-back lessons  
* Non-MVP features:  
  * Allow students (and maybe profs) to prioritize their availability (certain times are preferred over others but all of them work)  
  * 

# Logistics {#logistics}

GitHub

* Let’s make a GitHub org  
* Should we share the same repository for Client and Server? im gonna say yes  
* There’s no need for unit tests at first. If we have actual users, then we can have some continuous integration/testing and a canary/staging environment.

# Business {#business}

## [LINK TO DUBHACKS HACKER GUIDE](https://dubhacks.notion.site/dh25-hacker-guide?pvs=74) {#link-to-dubhacks-hacker-guide}

* What should we call this app?  
  * MusiCal?  
  * logo?  
* Dubhacks tracks:   
  * main track: Grow  
    * **GROW \- The Advocate**  
    * Powerful solutions bring us closer and help us thrive. This track celebrates technology's role in strengthening our ties to each other, our communities, and the world around us, while also empowering ourselves.  
    * It's **human-centered and fosters belonging**, bridge gaps, and unlock personal and collective growth. The Advocate build tools that unite, uplift, and drive positive, lasting change.  
    * ***Topics to Consider:***  
    * *Friendship, Mental & Physical Wellness, Peer-to-Peer Interactions, Neighborhoods, Homelessness, Political Activism, Civic Technology, Learning, Sustainability, Education, Childhood Development, Environment, Climate Change*  
  * [side tracks](https://dubhacks.notion.site/sponsors-side-track)? (up to 4\)  
    * dubhacks next	  
    * MLH: Best Domain Name from GoDaddy Registry  
      * can just register the name as a domain?  
    * maybe statsig  
    * maybe cloudflare, gemini, or reach capital for ai integration  
* Promotion/pitch ideas  
  * We should emphasize how this is different from when2meet (when2meet is for scheduling a single time for everyone) and how it’s different from appointment/1:1 schedulers (we want to minimize teaching days, minimize gaps, etc.)  
  * Do we want to have a video or just rely on in-person pitch?  
  * Let’s storyboard our pitch:  
    * We have experienced our music professors being in scheduling hell  
    * Nick \-- I can show the messy old-school emails Ben uses to try to schedule with everyone  
    * Jeppy \- me too, cristina crashed tf out this quarter  
* Devs  
  * Nick has chatgpt pro so we can share that for demanding queries  
  * Work plan:  
    * By midnight Saturday: have a feature complete MVP that functions locally  
    * UI polished by 6am Sunday  
    * Have devpost completed by 10:30am Sunday