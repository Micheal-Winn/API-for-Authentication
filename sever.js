require("dotenv").config()

const express = require('express');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const app = express();

app.use(express.json())


function authenticationToken(req,res,next){
    const authHeaders = req.headers['authorization']
    const token =authHeaders && authHeaders.split(' ')[1]
    if (token === null) return res.sendStatus(401)
    jwt.verify(token,process.env.TOKEN__SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        req.user = user;
        next()
    })

}


const users = [];
app.get("/users",(req,res)=>{
    res.json(users)
})

app.post('/users',async (req,res)=>{
    try{
        // const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password,10)
        const user = {
            name : req.body.name,
            email : req.body.email,
            password : hashedPassword
        }
        users.push(user)
        let payload = {id : user._id};
        const token = jwt.sign(payload,process.env.TOKEN__SECRET);
        res.status(201).send({token})
    }catch{
        res.status(400).send()
    }

})

const usrCheck = async(username,password) =>{
    // const userFilter = users.filter(user=>user.name === username);

    const user = await users.filter(user=>user.name === username);
    if(user)
    {
        //console.log('Username ',userName, " Password ",user.password);
        const validPass = await bcrypt.compare(password, user.password);
        if(validPass)
        {
            return user;
        }
        else
        {
            throw Error("Invalid user or password");
        }
    }
    throw Error("Invalid user or password");;
}

app.post('/users/login',authenticationToken,async (req,res)=>{
    let username = req.body['name'];
    let password = req.body['password'];
    try
    {
        let user = await usrCheck(username,password);
        console.log(user)
        let payload = { id: user._id };
        const token = jwt.sign(payload, process.env.TOKEN__SECRET);
        res.status(200).send({ token });
    }
    catch (err) {
        console.log(err)
        res.status(404).send({message:"Invalid user"});
    }

})


app.listen(3000)