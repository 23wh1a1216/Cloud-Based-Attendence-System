# Cloud-Based Attendance System

A serverless attendance app: enter student names, mark them present or absent, and view the records from any device.

## Features
- Add and remove students
- Mark Present / Absent by date
- Live attendance rate, search and filters
- Works on phones and laptops

## Architecture
- Frontend: static HTML/CSS/JS (`index.html`), hosted on GitHub Pages or S3
- Backend: AWS Lambda with a Function URL (`lambda/index.mjs`)
- Database: Amazon DynamoDB (table `Attendance`, keys `pk` and `sk`)

## Setup
1. Create a DynamoDB table named `Attendance` with partition key `pk` (String) and sort key `sk` (String).
2. Create a Lambda function (Node.js 20.x) using `lambda/index.mjs`, and give its role `dynamodb:PutItem`, `DeleteItem` and `Query` on the table.
3. Create a Function URL with auth NONE and CORS enabled.
4. Put the Function URL in the `API` constant in `index.html`.
5. Host `index.html` anywhere static.

## Notes
All services stay within the AWS free tier.
