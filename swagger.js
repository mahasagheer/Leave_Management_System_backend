const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Leave Management System API",
    description: `
      The Leave Management System API is designed to streamline the process of managing employee leave requests within an organization. 
      This API provides endpoints for employees, HR personnel, and administrators to interact with the leave system.

      ### Key Features:
      - **Leave Requests:** Employees can submit requests for different types of leave, such as vacation, sick leave, and personal leave.
      - **Approval Workflow:** HR personnel and administrators can review, approve, or reject leave requests, with the ability to provide comments.
      - **Leave Balances:** Employees can view their remaining leave balances, and the system automatically adjusts these balances upon approval of leave.
      - **Real-Time Notifications:** Users receive notifications about the status of their leave requests, including approval, rejection, or any required actions.
      - **Reporting:** The system offers reporting capabilities for HR to track leave trends, balances, and employee leave history.
      
      This API aims to facilitate efficient communication and record-keeping regarding employee leaves, ensuring transparency and accuracy within the organization.
    `,
    version: "1.0.0",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./app");
});
