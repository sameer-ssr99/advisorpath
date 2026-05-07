 const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Course = require('./models/Course');
const Plan = require('./models/Plan');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/advisorpath');
    console.log('MongoDB Connected for Seeding');

    // Clear collections
    await User.deleteMany();
    await Course.deleteMany();
    await Plan.deleteMany();
    console.log('Cleared existing data.');

    // 1. Create Users (passwords will be hashed by pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@advisorpath.com',
      password: 'Admin@123',
      role: 'admin'
    });

    const advisor = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'advisor@advisorpath.com',
      password: 'Advisor@123',
      role: 'advisor'
    });

    const student = await User.create({
      name: 'Alex Student',
      email: 'student@advisorpath.com',
      password: 'Student@123',
      role: 'student',
      advisor: advisor._id  // auto-linked to the system advisor
    });
    console.log('Users created and linked.');

    // 2. Create Courses without prerequisites first
    const coursesData = [
      { code: 'CS101', name: 'Intro to Programming', credits: 3 },
      { code: 'CS102', name: 'Data Structures', credits: 3 },
      { code: 'CS201', name: 'Algorithms', credits: 3 },
      { code: 'CS202', name: 'Discrete Mathematics', credits: 3 },
      { code: 'CS301', name: 'Operating Systems', credits: 3 },
      { code: 'CS302', name: 'Database Systems', credits: 3 },
      { code: 'CS401', name: 'Software Engineering', credits: 3 },
      { code: 'CS402', name: 'Machine Learning', credits: 3 },
      { code: 'MATH101', name: 'Calculus I', credits: 4 },
      { code: 'MATH201', name: 'Linear Algebra', credits: 3 }
    ];

    const insertedCourses = await Course.insertMany(coursesData);
    const courseMap = {};
    for (const c of insertedCourses) {
      courseMap[c.code] = c._id;
    }

    // 3. Update prerequisites
    await Course.updateOne({ _id: courseMap['CS102'] }, { prerequisites: [courseMap['CS101']] });
    await Course.updateOne({ _id: courseMap['CS201'] }, { prerequisites: [courseMap['CS102']] });
    await Course.updateOne({ _id: courseMap['CS202'] }, { prerequisites: [courseMap['CS101']] });
    await Course.updateOne({ _id: courseMap['CS301'] }, { prerequisites: [courseMap['CS201'], courseMap['CS202']] });
    await Course.updateOne({ _id: courseMap['CS302'] }, { prerequisites: [courseMap['CS201']] });
    await Course.updateOne({ _id: courseMap['CS401'] }, { prerequisites: [courseMap['CS301'], courseMap['CS302']] });
    await Course.updateOne({ _id: courseMap['CS402'] }, { prerequisites: [courseMap['CS201'], courseMap['CS202']] });
    await Course.updateOne({ _id: courseMap['MATH201'] }, { prerequisites: [courseMap['MATH101']] });
    console.log('Courses created and linked.');

    // 4. Create Plan
    const sem1Credits = 3 + 4; // CS101(3), MATH101(4)
    const sem2Credits = 3 + 3 + 3; // CS102(3), CS202(3), MATH201(3)
    const sem3Credits = 3 + 3 + 3; // CS201(3), CS301(3), CS302(3)

    await Plan.create({
      student: student._id,
      title: "CS Bachelor's Plan",
      status: 'draft',
      semesters: [
        {
          name: 'Fall 2024',
          courses: [courseMap['CS101'], courseMap['MATH101']],
          totalCredits: sem1Credits
        },
        {
          name: 'Spring 2025',
          courses: [courseMap['CS102'], courseMap['CS202'], courseMap['MATH201']],
          totalCredits: sem2Credits
        },
        {
          name: 'Fall 2025',
          courses: [courseMap['CS201'], courseMap['CS301'], courseMap['CS302']],
          totalCredits: sem3Credits
        }
      ]
    });
    console.log('Sample plan created.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
