const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
// const  {MongoClient } = require('mongodb')  
const mongoose = require('mongoose')
mongoose.connect(process.env.DB)

const {Schema} = mongoose

const ExerciseSchema = new Schema({
  user_id : {type: String ,required:true},
  description: String,
  duration: Number,
  date:Date,
});

const UserSchema = new Schema({
  username: String,
})

const Exercise = mongoose.model('Exercise',ExerciseSchema)
const User = mongoose.model('User',UserSchema)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))

app.post("/api/users", async (req,res)=>{
  // console.log(req.body)
  const userObject = new User({
    username: req.body.username
  })
  
  try {
    const user  = await userObject.save()
    console.log(user)
    res.json(user)
  } catch (error) {
    console.log(err)
  }
})


app.post("/api/users/:_id/exercises", async (req,res)=>{
  const id = req.params._id
  const {description, duration, date} = req.body
  try {
    const user  = await User.findById(id)
    if(!user){
      res.send("not found user")
    }else{
      const exerciseOject = new Exercise({
        user_id:user._id,
        description,
        duration,
        date : date ? new Date(date) : new Date()
      })
        const exercise =  await exerciseOject.save()
        res.json({
          _id: user._id,
          username:user.username,
          description: exercise.description,
          duration:exercise.duration,
          date : new Date(exercise.date).toDateString()
        })
    }
  } catch (error) {
    console.log(error)
    res.send("There was an error during save exercise")

  }
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
  const users  = await User.find({}).select("_id username")
    if(!users) {
      res.send('no users')
    }else {res.json(users)}
})

app.get("/api/users/:_id/logs", async (req,res) => {
  const {from,to,limit} = req.query
  const id = req.params._id
  const user = await User.findById(id)
  let filter = {user_id:id}
  if(!user){
    res.send('not user found')
    return
  }
  let dateOject = {}
  if(from){
    dateOject["$gte"] = new Date(from)
  }
  if(to){
    dateOject["$lte"] = new Date(to)
  }
  if(from || to){
    filter.date = dateOject
  }

  const exercises = await Exercise.find(filter).limit(+limit)

  const log  = exercises.map(  exr => ({
    description:exr.description,
    duration:exr.duration,
    date: exr.date.toDateString()
  }))
  res.json({
    username:user.username,
    count:exercises.length,
    _id:user._id,
    log
  })

})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
