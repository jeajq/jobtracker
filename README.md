# Job Tracker
University of Technology Sydney (UTS) 
4113 Software Development Project

## Team Members
* Jean Quisumbing (13192190)
* Althea Manigsaca (25265048)
* Stacey Debulos (24485979)
* Thushan Waduarachchige (14483515)
* Moneli Peries (14483984)

## Project Description
Job Tracker is a React-based web application designed to help users manage and monitor their job applications efficiently through a clean, Kanban-style interface. The system integrates with Google Firestore to enable real-time updates and persistence of user data.

The platform allows users to:
- Organise job applications into workflow stages: *Applied*, *Assessment*, *Interview*, *Offer*, and *Rejected*.
- Drag and drop job cards between columns to reflect the progress of each application.
- Search for new job opportunities using a built-in **Job Search** feature.
- Save and manage interesting job postings within the **Saved Jobs** section.
- Enjoy a modern, dark-themed interface designed for usability and clarity.

This project was developed as part of a **UTS Software Development Studio** coursework, serving as a prototype for an application targeted at **students and early-career professionals** who need an easy way to organise and track their job search process.

The client’s goal was to create a **centralised job management system** that combines tracking, discovery, and saving of potential opportunities in one place.

## Key Features
- Real-time data synchronisation using **Firebase Firestore**
- Fully interactive **drag-and-drop Kanban board**
- Responsive dark UI aligned with modern design standards
- Store interesting job listings for later
- Display real listings that can be saved and applied to
- Admin dashboard for managing listings and applicant stages
- Secure login using Firebase Authentication
- Add job and view job applicants feature for employers

## Tech Stack
- **Languages:** ReactJS, Tailwind CSS, HTML 
- **Database:** Google Firebase Firestore
- **Desktop Framework:** Electron

## How to Run 
````
* Download from GitHub Repo
* Unzip file to your preferred location
* Open Command Prompt and change the current directory to job-tracker (project root folder)
* Run "npm install" to download necessary modules, this starts the app at http://localhost:3000
* Run "npm start" to start server
* Open a second window of Command Prompt and change the current directory to /server folder
* Run "npm install" to download necessary modules
* Run "npm start" to start webscraping, server should run and retrieve jobs
````
## Links

* Jira: https://utswpmsm.atlassian.net/jira/software/projects/JT/boards/34/backlog?atlOrigin=eyJpIjoiZDcyYmJjMzZhMjQyNDJlYThiZWY0MjNkMzk3YmUzYzEiLCJwIjoiaiJ9\
* Confluence: https://student-team-ex81d3tt.atlassian.net/wiki/x/AoAE
* GitHub: https://github.com/jeajq/jobtracker


