/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

// Temporary in-memory storage for LMS courses
let courses = []

// Routes

// Get all courses
app.get('/courses', (req, res) => {
  res.json(courses)
})

// Add a new course
app.post('/courses', (req, res) => {
  const { title, description } = req.body
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' })
  }
  const newCourse = { id: courses.length + 1, title, description }
  courses.push(newCourse)
  res.json(newCourse)
})

// Start server
const PORT = 5000
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running at http://localhost:${PORT}`)
})
