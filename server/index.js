const port = 3000;

const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { error } = require("console");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("/Uploads"));

const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "elite_event_organizer"
});

database.connect((error) => {
    if(error)
    {
        console.log("Database error: "+error);
        throw error;
    }
    else
    {
        console.log("Database connect...");
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "Uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

// creating api for admin sign up:
app.post("/admin/signup", async (req, res) => {
    const hashPass = await bcrypt.hash(req.body.password, 10);
    const sql = "SELECT * FROM admin WHERE email=?";
    database.query(sql, [req.body.email] , (error, data) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        else if(data.length===0)
        {
            const sql = "INSERT INTO admin (`name`, `email`, `address`, `password`) VALUES (?)";
            const values = [
                req.body.name,
                req.body.email,
                req.body.address,
                hashPass
            ];
            database.query(sql, [values], (error, result) => {
                if(error)
                {
                    console.log("Error: "+error);
                    return res.status(404).json(error);
                }
                res.status(201).json({message: `Wlcome ${req.body.name}.`});
            });
        }
        else
        {
            res.status(400).json({message: "This email already exited."});
        }
    });
});

// creating api for admin sign in:
app.post("/admin/signin", (req, res) => {
    const sql = "SELECT * FROM admin WHERE email=?";
    database.query(sql, [req.body.email], (error, result) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        else if(result.length > 0)
        {
            const admin = result[0];
            bcrypt.compare(req.body.password, admin.password, (error, isMatch) => {
                if(error)
                {
                    console.log("Error: "+error);
                    return res.status(404).json(error);
                }
                else if(isMatch)
                {
                    const token = jwt.sign({email: admin.email}, "key", {expiresIn: "1d"});
                    res.cookie("token", token);
                    return res.status(201).json("sign in successful.");
                }
                res.status(400).json({message: "Incorrect password"});
            });
        }
        else
        {
            res.status(400).json({message: "Incorrect email."});
        }
    });
});

// create api for add employee in elite event organizer:
app.post("/add-employee", (req, res) => {
    const sql = "INSERT INTO employee (name, contact_info) VALUES (?,?)";
    database.query(sql, [req.body.name, req.body.contact_info], (error, result) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: `Welcome ${req.body.name}`});
    });
});

// create api for get all employee:
app.get("/all-employee", (req, res) => {
    const sql = "SELECT * FROM employee";
    database.query(sql, (error, result) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        else if(result === 0)
        {
            return res.json(201).json({message: "No employee."});
        }
        res.status(201).json({data: result});
    });
});

// creating api for add supervisor:
app.post("/add-supervisor/:employee_id", (req, res) => {
    const sql = "INSERT INTO supervisor (employee_id) VALUES(?)";
    database.query(sql, [req.params.employee_id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "new supervisor add successful."});
    });
});

// creating api for see detail inforation of a specific employee:
app.get("/employee/:id", (req, res) => {
    const sql = "SELECT * FROM employee WHERE id=?";
    database.query(sql, [req.params.id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for delete a employee data:
app.delete("/delete-employee/:id", (req, res) => {
    const sql = "DELETE FROM employee WHERE id=?";
    database.query(sql, [req.params.id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "employee data delete successful."});
    });
});

// creating api for delete a supervisor:
app.delete("/delete-supervisor/:id", (req, res) => {
    const sql = "DELETE FROM supervisor WHERE id=?";
    database.query(sql, [req.params.id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "supervisor data delete successful."});
    });
});

// creating api for get all supervisor:
app.get("/all-supervisor", (req, res) => {
    const sql = "select * from supervisor";
    database.query(sql, (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
            res.status(201).json({data: r});
    });
});

// creating api for count total employee:
app.get("/count-employee", (req, res) => {
    const sql = "select count(id) as employee from employee";
    database.query(sql, (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for count total supervisor:
app.get("/count-supervisor", (req, res) => {
    const sql = "select count(id) as supervisor from supervisor";
    database.query(sql, (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// create api for see detail specific supervisor detail:
app.get("/supervisor/:id", (req, res) => {
    const sql = "SELECT * FROM supervisor WHERE id=?";
    database.query(sql, [req.params.id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for add venue:
app.post("/add-venue", (req, res) => {
    const sql = "INSERT INTO venue (name, address, capacity) VALUES(?)";
    const values = [
        req.body.name,
        req.body.address,
        req.body.capacity
    ];
    database.query(sql, [values], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json("Venue add successful.");
    });
});

// creating api for add event:
app.post("/add-event", (req, res) => {
    const sql = "insert into event (name, start_date, end_date, description, venue_id, supervisor_id) values(?)";
    const values = [
        req.body.name,
        req.body.start_date, 
        req.body.end_date,
        req.body.description,
        req.body.venue_id,
        req.body.supervisor_id
    ];
    database.query(sql, [values], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "new event add successful."});
    });
});

// creating api for details of specific venue:
app.get("/venue/:id", (req, res) => {
    const sql = "select * from venue where id=?";
    database.query(sql, [req.params.id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for details of specific event:
app.get("/event/:id", (req, res) => {
    const sql = "select * from event where id=?";
    database.query(sql, [req.params.id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for get all event:
app.get("/all-events", (req, res) => {
    const sql = "select * from event";
    database.query(sql, (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// create api for add material expense:
app.post("/event/material-expense/:event_id", (req, res) => {
    const sql = "insert into material_expense (event_id, description, amount) values(?)";
    const values = [
        req.params.event_id,
        req.body.description,
        req.body.amount
    ];
    database.query(sql, [values], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "add successful."});
    });
});

// create api for add service expense:
app.post("/event/service-expense/:event_id", (req, res) => {
    const sql = "insert into service_expense (event_id, description, amount) values(?)";
    const values = [
        req.params.event_id,
        req.body.description,
        req.body.amount
    ];
    database.query(sql, [values], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "add successful."});
    });
});


// creating api for add guest list:
app.post("/event/guest/:event_id", (req, res) => {
    const sql = "insert into guest_list (name, attend, event_id) values(?)";
    const values = [
        req.body.name,
        req.body.attend,
        req.params.event_id
    ];
    database.query(sql, [values], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({message: "add successful."});
    });
});

// creating api for details of all guests in a event:
app.get("/event/guests-list/:event_id", (req, res) => {
    const sql = "select * from guest_list where event_id=?";
    database.query(sql, [req.params.event_id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for details of all material expenses in a event:
app.get("/event/material-expenses/:event_id", (req, res) => {
    const sql = "select * from material_expense where event_id=?";
    database.query(sql, [req.params.event_id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for details of all service expenses in a event:
app.get("/event/service-expenses/:event_id", (req, res) => {
    const sql = "select * from service_expense where event_id=?";
    database.query(sql, [req.params.event_id], (error, r) => {
        if(error)
        {
            console.log("Error: "+error);
            return res.status(404).json(error);
        }
        res.status(201).json({data: r});
    });
});

// creating api for logout:
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(201).json({message: "successful"});
});


// for server running:
app.listen(port, () => {
    console.log("Server Running...");
});