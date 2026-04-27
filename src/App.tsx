import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { GuestOnlyLayout } from '@/layouts/GuestOnlyLayout'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { RoleGuardLayout } from '@/layouts/RoleGuardLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { TeacherLayout } from '@/layouts/TeacherLayout'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import StudentDashboardPage from '@/pages/StudentDashboardPage'
import StudentResultsPage from '@/pages/StudentResultsPage'
import { HomeRedirect } from '@/pages/HomeRedirect'
import LessonPage from '@/pages/LessonPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import UpdatePasswordPage from '@/pages/UpdatePasswordPage'
import TeacherDashboardPage from '@/pages/TeacherDashboardPage'
import TeacherQuizPage from '@/pages/TeacherQuizPage'
import TeacherResultsPage from '@/pages/TeacherResultsPage'
import TeacherLessonsPage from '@/pages/TeacherLessonsPage'
import GuidePage from '@/pages/GuidePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/help" element={<Navigate to="/guide" replace />} />
      <Route element={<GuestOnlyLayout />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route element={<RoleGuardLayout allowed={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
        <Route element={<RoleGuardLayout allowed={['teacher']} />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher" element={<TeacherDashboardPage />} />
            <Route path="/teacher/lessons" element={<TeacherLessonsPage />} />
            <Route path="/teacher/results" element={<TeacherResultsPage />} />
            <Route path="/teacher/lessons/:lessonId/quiz" element={<TeacherQuizPage />} />

          </Route>
        </Route>
        <Route element={<RoleGuardLayout allowed={['student']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/results" element={<StudentResultsPage />} />
            <Route path="/student/lessons/:lessonId" element={<LessonPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
