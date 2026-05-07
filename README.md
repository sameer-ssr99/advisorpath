# AdvisorPath

AdvisorPath is a role-based academic advising platform with full-stack support for planning, sessions, messaging, grades, progress tracking, and admin operations.

## Prerequisites
- Node.js 20+
- MongoDB local or remote
- npm 9+

## Install
```bash
cd advisorpath/server && npm install
cd ../client && npm install
```

## Environment Setup
Copy `server/.env.example` to `server/.env` and configure:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/advisorpath
JWT_SECRET=change_this_secret
CLIENT_URL=http://localhost:5173
```

## Seed Data
```bash
cd advisorpath/server
npm run seed
```

## Run
Terminal 1:
```bash
cd advisorpath/server
npm run dev
```

Terminal 2:
```bash
cd advisorpath/client
npm run dev
```

## Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@advisorpath.edu | Password123! |
| Advisor | advisor@advisorpath.edu | Password123! |
| Student | student@advisorpath.edu | Password123! |

## Module-wise Feature Map
- Student: dashboard metrics, plan create/update/validate/submit, course catalog and prereq chain, sessions scheduling/cancel, messaging read/important, profile/settings/password, transcript CSV download, progress/GPA/credits/expected graduation
- Advisor: dashboard KPIs, submitted plan review approve/reject with notes/timestamps, session respond accept/reschedule/reject, student marks add/update with comments
- Admin: system stats, user list/role/active toggle, course CRUD, requirements configuration

## API Table
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Courses
- `GET /api/courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`
- `GET /api/courses/:id/prereq-chain`

### Plans
- `GET /api/plans`
- `GET /api/plans/:id`
- `POST /api/plans`
- `PUT /api/plans/:id`
- `DELETE /api/plans/:id`
- `POST /api/plans/:id/validate`
- `POST /api/plans/:id/submit`
- `POST /api/plans/:id/approve`
- `POST /api/plans/:id/reject`

### Sessions
- `GET /api/sessions`
- `POST /api/sessions`
- `PUT /api/sessions/:id/cancel`
- `PUT /api/sessions/:id/respond`

### Messages
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `PUT /api/messages/:id/read`
- `PUT /api/messages/:id/important`

### Grades + Progress
- `GET /api/grades/student/:id`
- `POST /api/grades`
- `PUT /api/grades/:id`
- `GET /api/progress/student/:id`

### Users/Admin/Notifications
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id/role`
- `PUT /api/users/:id/profile`
- `PUT /api/users/me/profile`
- `POST /api/users/me/change-password`
- `GET /api/users/:id/transcript`
- `GET /api/advisor/dashboard`
- `GET /api/admin/dashboard`
- `PUT /api/admin/users/:id/active`
- `GET /api/admin/requirements`
- `PUT /api/admin/requirements`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

## DAG Logic
`server/utils/dagValidator.js` provides:
- `buildGraph`: adjacency from course -> prerequisites
- `detectCycles`: DFS cycle detection
- `topologicalSort`: ordering for validation context
- `getPrerequisiteChain`: recursive prerequisite expansion
- `validatePlan`: enforces missing prereqs, duplicate courses, semester credits (1-18), and returns structured errors/warnings and credit summary

## Testing / Quality Checklist
1. Seed data: `npm run seed` in server.
2. Start backend and frontend.
3. Login all three roles with seeded credentials.
4. Student flow:
   - Create/edit plan
   - Validate and submit plan
   - Schedule a session
   - Send message in existing conversation
   - Download transcript
5. Advisor flow:
   - Review submitted plan and approve/reject with note
   - Respond to requested session
   - Add/update grade for student
6. Admin flow:
   - Open dashboard stats
   - Update user role or active status
   - Manage course and requirement config
7. Automated smoke check (server running):
```bash
cd advisorpath/server
npm run check:smoke
```
Expected: `Smoke checks passed`.

## Troubleshooting
- `401 Unauthorized`: ensure token exists in localStorage and user is active.
- `Mongo connection error`: verify `MONGO_URI` and Mongo service status.
- CORS issues: confirm `CLIENT_URL` matches frontend URL.
- Seed duplicates: run `npm run seed` again; seed script clears collections first.
