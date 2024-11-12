### handdeng-node-server

### Introduction

`handdeng-node-server` is a lightweight HTTP server framework built on Node.js, designed to simplify the creation and management of API services. This framework provides flexible routing, permission verification, parameter validation, and error handling mechanisms, making it ideal for building high-performance RESTful API services.

### Features

- **GET/POST Routing**: Supports the registration of handler functions for GET and POST requests.
- **Permission Verification**: Allows enabling or disabling permission checks for individual APIs.
- **Parameter Validation**: Supports type and required field validation for API request parameters.
- **Global Error Handling**: Provides customizable global error handling mechanisms.
- **Flexible Routing**: Supports custom handling for missing routes and incorrect HTTP methods.

### Quick Start

1. **Install Dependencies**

   ```bash
   npm install handdeng-node-server
   ```

2. **Create a Server Instance**

   ```typescript
   import { NodeServer } from "handdeng-node-server";
   const server = new NodeServer(3000, "localhost");
   ```

3. **Register API Routes**

   ```typescript
   server.get("/api/test", (req, res) => {
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ message: "GET request success" }));
   });

   server.post("/api/test", (req, res) => {
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ message: "POST request success" }));
   });
   ```

4. **Start the Server**

   Run your script to start the server:

   ```bash
   node index.js
   ```

5. **Test the API**

   You can test your API by visiting `http://localhost:3000/api/test`.

### API Configuration Options

- **openPermissionVerify**: Whether to enable permission verification. Default is `true`.
- **paramsList**: A list of parameter validation rules, including the parameter key, type, and whether it's required.

### Error Handling

- **catch**: Global error handler function.
- **paramsError**: Handler function for request parameter errors.
- **notFount**: Handler function for cases where the route is not found.
- **methodsError**: Handler function for incorrect HTTP methods.
