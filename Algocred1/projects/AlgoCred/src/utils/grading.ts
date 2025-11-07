// src/utils/grading.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Institution } from './registeredinstitutions'

// =======================
// 🎓 GPA CALC FUNCTIONS
// =======================

// ✅ Karachi University (standard 4.0 scale)
function calculateCGPA_KarachiUniversity(courses: { marks: number }[]): { total: number; percentage: number; cgpa: string } {
  let totalMarks = 0
  const gpas: number[] = []

  courses.forEach((c) => {
    totalMarks += c.marks
    let gpa = 0
    if (c.marks >= 85) gpa = 4.0
    else if (c.marks >= 81) gpa = 3.8
    else if (c.marks >= 76) gpa = 3.4
    else if (c.marks >= 71) gpa = 3.0
    else if (c.marks >= 68) gpa = 2.8
    else if (c.marks >= 64) gpa = 2.4
    else if (c.marks >= 61) gpa = 2.0
    else if (c.marks >= 58) gpa = 1.8
    else if (c.marks >= 54) gpa = 1.4
    else if (c.marks >= 51) gpa = 1.0
    else gpa = 0
    gpas.push(gpa)
  })

  const avgGPA = gpas.reduce((a, b) => a + b, 0) / gpas.length
  const percentage = (totalMarks / (courses.length * 100)) * 100
  const cgpa = avgGPA === 0 ? 'Failed' : avgGPA.toFixed(2)

  return { total: totalMarks, percentage, cgpa }
}

// ✅ Sindh Madressatul Islam University (lenient scale)
function calculateCGPA_SMIU(courses: { marks: number }[]): { total: number; percentage: number; cgpa: string } {
  let totalMarks = 0
  const gpas: number[] = []

  courses.forEach((c) => {
    totalMarks += c.marks
    let gpa = 0
    if (c.marks >= 85) gpa = 4.0
    else if (c.marks >= 80) gpa = 3.7
    else if (c.marks >= 75) gpa = 3.3
    else if (c.marks >= 70) gpa = 3.0
    else if (c.marks >= 65) gpa = 2.7
    else if (c.marks >= 60) gpa = 2.3
    else if (c.marks >= 55) gpa = 2.0
    else if (c.marks >= 50) gpa = 1.7
    else if (c.marks >= 45) gpa = 1.0
    else gpa = 0
    gpas.push(gpa)
  })

  const avgGPA = gpas.reduce((a, b) => a + b, 0) / gpas.length
  const percentage = (totalMarks / (courses.length * 100)) * 100
  const cgpa = avgGPA === 0 ? 'Failed' : avgGPA.toFixed(2)

  return { total: totalMarks, percentage, cgpa }
}

// ✅ ABC University (stricter grading)
function calculateCGPA_ABC(courses: { marks: number }[]): { total: number; percentage: number; cgpa: string } {
  let totalMarks = 0
  const gpas: number[] = []

  courses.forEach((c) => {
    totalMarks += c.marks
    let gpa = 0
    if (c.marks >= 90) gpa = 4.0
    else if (c.marks >= 85) gpa = 3.8
    else if (c.marks >= 80) gpa = 3.4
    else if (c.marks >= 75) gpa = 3.0
    else if (c.marks >= 70) gpa = 2.8
    else if (c.marks >= 65) gpa = 2.5
    else if (c.marks >= 60) gpa = 2.0
    else gpa = 0
    gpas.push(gpa)
  })

  const avgGPA = gpas.reduce((a, b) => a + b, 0) / gpas.length
  const percentage = (totalMarks / (courses.length * 100)) * 100
  const cgpa = avgGPA === 0 ? 'Failed' : avgGPA.toFixed(2)

  return { total: totalMarks, percentage, cgpa }
}

// ✅ XYZ University (same as ABC or custom if needed)
function calculateCGPA_XYZ(courses: { marks: number }[]): { total: number; percentage: number; cgpa: string } {
  return calculateCGPA_ABC(courses)
}

// =======================
// 🎯 MAP EACH UNIVERSITY
// =======================
export const gradingMap: Record<string, (courses: any[]) => { total: number; percentage: number; cgpa: string }> = {
  'Karachi University': calculateCGPA_KarachiUniversity,
  'Sindh Madressatul Islam University': calculateCGPA_SMIU,
  'ABC University': calculateCGPA_ABC,
  'XYZ University': calculateCGPA_XYZ,
}

// =======================
// 🧩 UNIVERSAL FUNCTION
// =======================
export function calculateCGPAForInstitution(
  institutionName: Institution['name'],
  courses: { marks: number }[],
): { total: number; percentage: number; cgpa: string } {
  const calculator = gradingMap[institutionName]
  if (!calculator) {
    return calculateCGPA_KarachiUniversity(courses)
  }
  return calculator(courses)
}
