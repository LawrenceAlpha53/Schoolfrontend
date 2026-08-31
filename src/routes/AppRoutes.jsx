// src/AppRoutes.jsx - COMPLETE FIXED VERSION (WITH SCHOOL CONTEXT)
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Registration from "../Pages/Registration";
import Logout from "../Components/Logout";

import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import SecretaryLayout from "../layouts/SecretaryLayout";
import AdminSubjects from "../Pages/AdminSubjects";
import AIFullReport from "../Pages/AIFullReport";

import AdminDashboard from "../pages/AdminDashboard";
import TeacherDashboard from "../Pages/TeachersDashboard";
import SecretaryDashboard from "../Pages/SecretaryDashboard";
import NotificationsPage from "../Pages/NotificationPage";
import StudentProfilePage from "../Pages/StudentProfilePage";
import TeacherAttendance from "../Pages/TeacherAttendance";
import TeacherMarks from "../Pages/TeacherMarks";
import TeacherStudents from "../Pages/TeacherStudents";
import TeacherLessonPlans from "../Pages/TeacherLessonPlans";
import TeacherTimetable from "../Pages/TeacherTimetable";
import TeacherReports from "../Pages/TeacherReports";
import MyClasses from "../Pages/MyClasses";
import TeacherMarksEntry from "../Pages/TeacherMarksEntry";
import SecretaryMarksSummary from "../Pages/SecretaryMarksSummary";
import TeacherAttendanceTracker from "../Pages/TeacherAttendanceTracker";
import TeacherProfile from "../Pages/TeacherProfile";
import AdminClasses from "../Pages/AdminClasses";
import AdminAttendance from "../Pages/AdminAttendance";
import BulkSMSPage from "../Pages/BulkSMSPage";
import { AppSettingsProvider } from "../Components/AppSettingsContext";

import Students from "../pages/Students";
import Teachers from "../pages/Teachers";
import Subjects from "../pages/Subjects";
import Marks from "../pages/Marks";
import Fees from "../pages/Fees";
import StudentRecords from "../Pages/StudentRecords";
import EditStudent from "../Pages/EditStudent";
import ClassManagement from "../Pages/ClassManagement";
import SubjectManagement from "../Pages/SubJectManagement";
import TeacherManagement from "../Pages/TeacherManagement";
import FeesManagement from "../Pages/FeesManagement";
import AttendanceTracking from "../Pages/AttendanceTracking";
import Timetable from "../Pages/Timetable";
import ReportAnalytics from "../Pages/ReportAnalytics";
import Reports from "../Pages/Reports";
import Notification from "../Pages/Notification";
import Settings from "../Pages/Settings";
import Requirements from "../Pages/Requirements";
import Communications from "../Pages/Communication";

import StudentRegistration from "../Pages/StudentRegistraton";
import ManageFees from "../Pages/managerfees";

import CreateUser from "../Pages/CreateUser";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "../../ProtectedRoute";

// SMS pages
import SmsDashboard from "../Components/SmsDashboard";
import ComposeSms from "../Components/ComposeSms";
import SmsTemplates from "../Components/SmsTemplates";
import SmsHistory from "../Components/SmsHistory";
import SmsInbox from "../Components/SmsInbox";
import SmsBalance from "../Components/SmsBalance";
import AdminFees from "../Pages/AdminFees";
import AdminReports from "../Pages/AdminReports";
import AdminTimetable from "../Pages/AdminTimetable";
import AdminAnalytics from "../Pages/AdminAnalytics";
import AdminUserManagement from "../Pages/AdminUserManagement";
import AdminNotifications from "../Pages/AdminNotifcation";
import AdminSettings from "../Pages/AdminSettings";
import TeacherAnalytics from "../Pages/TeacherAnalytics";
import TeacherNotifications from "../Pages/TeacherNotifcation";
import TeacherSettings from "../Pages/TeacherSettings";

// =============== NEW: SCHOOL CONTEXT PROVIDER ===============
import { SchoolProvider } from '../Pages/SchoolContext';   // adjust path as needed
import StudentFees from "../Pages/StudentFees";
import StudentEdit from "../Pages/StudentEdit";
import AdminPayroll from "../Pages/AdminPayroll";

const AppRoutes = () => {
  
  console.log('📌 AppRoutes: Rendering routes...');

  return (
    
    <SchoolProvider> 
      <AppSettingsProvider>         {/* <--- THIS WRAPS EVERYTHING */}
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/logout" element={<Logout />} />

        {/* ================= ADMIN ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="attendances" element={<AdminAttendance />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="marks" element={<Marks />} />
            <Route path="notificatons" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="admin-management" element={<AdminUserManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="fees" element={<Fees />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="adminfees" element={<AdminFees />} />
            <Route path="create-user" element={<CreateUser />} />

 <Route path="admin-payroll" element={<AdminPayroll />} />

            <Route path="adminclasses" element={<AdminClasses />} />
            <Route path="adminsubjects" element={<AdminSubjects />} />
            <Route path="ai-report" element={<AIFullReport />} />
            {/* SMS */}
            <Route path="sms-dashboard" element={<SmsDashboard />} />
            <Route path="sms-compose" element={<ComposeSms />} />
<Route path="bulk-phonenumbers" element={<BulkSMSPage />} />
            <Route path="sms-temsplate" element={<SmsTemplates />} />

            <Route path="sms-history" element={<SmsHistory />} />

            <Route path="sms-inbox" element={<SmsInbox />} />

            <Route path="sms-balance" element={<SmsBalance />} />
          </Route>
        </Route>

        {/* ================= TEACHER ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="marks" element={<TeacherMarks />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="lesson-plans" element={<TeacherLessonPlans />} />
            <Route path="timetable" element={<TeacherTimetable />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="myclass" element={<MyClasses />} />
            <Route path="marks-entry" element={<TeacherMarksEntry />} />
            <Route path="teacheranalytics" element={<TeacherAnalytics />} />
            <Route path="teachernotification" element={<TeacherNotifications />} />
            <Route path="teachersettings" element={<TeacherSettings />} />
            <Route path="marks-summary" element={<SecretaryMarksSummary />} />
            <Route path="sms/dashboard" element={<SmsDashboard />} />
            <Route path="sms/compose" element={<ComposeSms />} />
            <Route path="sms/history" element={<SmsHistory />} />
          </Route>
        </Route>

        {/* ================= SECRETARY ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["secretary"]} />}>
          <Route path="/secretary" element={<SecretaryLayout />}>
            <Route index element={<SecretaryDashboard />} />
            <Route path="dashboard" element={<SecretaryDashboard />} />
            <Route path="studentregistration" element={<StudentRegistration />} />
            <Route path="fees" element={<ManageFees />} />
            <Route path="notification" element={<NotificationsPage />} />
            <Route path="students" element={<StudentRecords />} />
<Route path="studentFees" element={<StudentFees />} />
<Route path="studentedit/:id" element={<StudentEdit />} />



            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="students/edit/:id" element={<EditStudent />} />
            <Route path="classmanagement" element={<ClassManagement />} />
            <Route path="subjectmanagement" element={<SubjectManagement />} />
            <Route path="teachermanagement" element={<TeacherManagement />} />
            <Route path="feesmanagement" element={<FeesManagement />} />
            <Route path="attendance" element={<AttendanceTracking />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="reports" element={<ReportAnalytics />} />
            <Route path="reports-section" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="teacherAttendance" element={<TeacherAttendanceTracker />} />
            <Route path="teacherprofile" element={<TeacherProfile />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="communications" element={<Communications />} />
            <Route path="sms/dashboard" element={<SmsDashboard />} />
            <Route path="sms/compose" element={<ComposeSms />} />
            <Route path="sms/templates" element={<SmsTemplates />} />
            <Route path="sms/history" element={<SmsHistory />} />
            <Route path="sms/inbox" element={<SmsInbox />} />
            <Route path="sms/balance" element={<SmsBalance />} />
            <Route path="bulk/phonenumbers" element={<BulkSMSPage />} />
          </Route>
        </Route>

        {/* ================= UNAUTHORIZED ================= */}
        <Route
          path="/unauthorized"
          element={
            <div className="h-screen flex items-center justify-center text-3xl font-bold text-red-600">
              403 - Access Denied
            </div>
          }
        />

        {/* ================= 404 ================= */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AppSettingsProvider>
    </SchoolProvider>
    
  );
};

export default AppRoutes;