# Backend Project

## Project Description

This is a comprehensive backend project designed to provide a robust and scalable foundation for a multi-tenant application, likely in an educational or communal context, given the `Halaka` and `Zoom` integrations. It supports secure user authentication, real-time communication, session management, and scheduled tasks.

## Features

- **Comprehensive User Roles**: Distinct dashboards and functionalities tailored for Students, Teachers, and Admins, ensuring secure and role-based access control.
- **Advanced Teacher Search & Filtering**: Students can efficiently discover teachers by applying filters such as specialization, price, gender, and availability, facilitating precise matching for learning needs.
- **Secure Teacher Onboarding & Verification**: Implements a robust multi-step onboarding process where teachers build detailed profiles and submit necessary documents for thorough administrative approval, ensuring platform integrity and quality.
- **Flexible Halaka (Study Circle) Management**: Teachers are empowered to create and manage various types of Islamic study circles (Halakat), including private one-on-one sessions and public group sessions. This includes customizable scheduling (daily/weekly recurrence), flexible pricing models, and diverse curriculum options.
- **Seamless Enrollment & Payment System**: Provides a streamlined process for students to enroll in group Halakat or accept invitations to private sessions, integrated with a secure payment system to confirm participation.
- **Integrated Wallet & Payout System**: Features a built-in financial system where teachers accumulate earnings from completed sessions in a personal wallet, with a clear process for requesting and administrative processing of payouts.
- **Real-time Communication**: Facilitates instant and fluid communication through an integrated chat system supporting both one-on-one dialogues between teachers and students, and group discussions within Halakat.
- **Automated Session Management & Attendance Tracking**: Incorporates seamless integration with Zoom for video conferencing, leveraging webhooks to automatically monitor and track session attendance, duration, and other key metrics.
- **Progress Tracking & Reviews**: Enables teachers to meticulously log and update student progress within Halaka sessions, while students can provide valuable feedback through ratings and reviews for teachers upon Halaka completion, fostering transparency and community engagement.
- **Dynamic Notification System**: Keeps all users (Students, Teachers, Admins) informed about critical platform activities and personalized events, such as new Halaka invitations, payment confirmations, upcoming session reminders, and administrative approvals.

## Technologies Used

- **Language**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Real-time Communication**: Socket.IO, Socket.IO-Client
- **Authentication**: JSON Web Tokens (jsonwebtoken), Bcrypt (bcrypt, bcryptjs)
- **Cloud Storage**: Cloudinary, Multer, Sharp, Streamifier
- **Utilities**: Nodemailer (for emails), Luxon (for date/time), Axios (for HTTP requests), Express-validator (for request validation), Cookie-parser, Cors, Dotenv, Express-rate-limit, Crypto.
- **Development Tools**: Nodemon, Babel

## Database Schema

The project utilizes MongoDB as its primary database, with Mongoose as the ODM (Object Data Modeling) library for Node.js. The database schema is designed to support a multi-tenant application with comprehensive features. Key collections/models include:

- **Academy**: Manages information about different academies or organizations within the multi-tenant system.
- **User**: Stores user profiles, including roles (Student, Teacher, Admin), and authentication details.
- **Teacher**: Contains specific information and profiles for teachers, including specializations, ratings, and verification status.
- **Student**: Holds profiles and relevant data for students.
- **Halaka**: Defines the structure for study circles, including details about their type (private/group), schedule, curriculum, and enrolled students.
- **Session**: Tracks individual class sessions, including scheduled dates, Zoom meeting details, and attendance.
- **Enrollment**: Manages student enrollment in Halakat.
- **Message**: Stores one-on-one and group chat messages.
- **Conversation**: Manages metadata for chat conversations.
- **ChatGroup**: Defines chat groups for Halakat.
- **Token**: Handles JWT and refresh tokens for secure authentication, including device tracking and token revocation.
- **TeacherWallet**: Manages the financial wallets for teachers.
- **PayoutRequest**: Records requests made by teachers for payouts from their wallets.
- **Transaction**: Logs financial transactions within the platform.
- **Notification**: Stores notifications sent to users.
- **Document**: Manages uploaded documents, such as those for teacher verification.
- **Review**: Stores reviews and ratings given by students to teachers.
