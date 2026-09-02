import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users, BookOpen, CalendarDays, ClipboardCheck, Award, Clock, TrendingUp } from 'lucide-react';

const TeacherDashboardCards = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    subjects: 0,
    todayClasses: 0,
    pendingMarks: 0,
    attendanceRate: 0
  });
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        setLoading(false);
        return;
      }

      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      };

      console.log('📌 Fetching teacher stats...');

      const [
        teacherRes,
        studentsRes,
        classesRes,
        subjectsRes,
        marksRes,
        attendanceRes
      ] = await Promise.allSettled([
        api.get('/teachers/me', config),
        api.get('/teachers/me/students', config),
        api.get('/teachers/me/classes', config),
        api.get('/teachers/me/subjects', config),
        api.get('/marks/my-marks', config),
        api.get('/attendance/my-class', config)
      ]);

      let teacherData = null;
      let students = [];
      let classes = [];
      let subjects = [];
      let marks = [];
      let attendance = [];

      // Teacher data
      if (teacherRes.status === 'fulfilled') {
        teacherData = teacherRes.value.data?.data || teacherRes.value.data;
        setTeacher(teacherData);
        console.log('📌 Teacher data:', teacherData);
      } else {
        console.error('❌ Failed to fetch teacher:', teacherRes.reason?.message);
      }

      // Students
      if (studentsRes.status === 'fulfilled') {
        students = studentsRes.value.data?.data || studentsRes.value.data || [];
        console.log('📌 Students:', students.length);
      } else {
        console.error('❌ Failed to fetch students:', studentsRes.reason?.message);
        // Fallback
        if (teacherData?.classId) {
          try {
            const fallbackStudents = await api.get(`/students?classId=${teacherData.classId}`, config);
            students = fallbackStudents.data?.data || [];
          } catch (fallbackError) {
            console.error('❌ Fallback students failed:', fallbackError);
          }
        }
      }

      // Classes
      if (classesRes.status === 'fulfilled') {
        classes = classesRes.value.data?.data || classesRes.value.data || [];
        console.log('📌 Classes:', classes.length);
      } else {
        console.error('❌ Failed to fetch classes:', classesRes.reason?.message);
        if (teacherData?.classId) {
          try {
            const classRes = await api.get(`/classes/${teacherData.classId}`, config);
            if (classRes.data?.data) {
              classes = [classRes.data.data];
            }
          } catch (fallbackError) {
            console.error('❌ Fallback class failed:', fallbackError);
          }
        }
      }

      // Subjects
      if (subjectsRes.status === 'fulfilled') {
        subjects = subjectsRes.value.data?.data || subjectsRes.value.data || [];
        console.log('📌 Subjects:', subjects.length);
      } else {
        console.error('❌ Failed to fetch subjects:', subjectsRes.reason?.message);
        if (teacherData?.subjectId) {
          try {
            const subjectRes = await api.get(`/subjects/${teacherData.subjectId}`, config);
            if (subjectRes.data?.data) {
              subjects = [subjectRes.data.data];
            }
          } catch (fallbackError) {
            console.error('❌ Fallback subject failed:', fallbackError);
          }
        }
      }

      // Marks
      if (marksRes.status === 'fulfilled') {
        marks = marksRes.value.data?.data || marksRes.value.data || [];
        console.log('📌 Marks:', marks.length);
      } else {
        console.error('❌ Failed to fetch marks:', marksRes.reason?.message);
      }

      // Attendance – ✅ FIXED response handling
      if (attendanceRes.status === 'fulfilled') {
        // Extract array from response (handles {data: [...]} and direct array)
        let attendanceData = attendanceRes.value.data?.data || attendanceRes.value.data;
        // Ensure it's an array
        if (Array.isArray(attendanceData)) {
          attendance = attendanceData;
        } else {
          console.warn('Attendance data is not an array, using empty array');
          attendance = [];
        }
        console.log('📌 Attendance:', attendance.length);
      } else {
        console.error('❌ Failed to fetch attendance:', attendanceRes.reason?.message);
      }

      // Calculate pending marks
      const pendingMarks = marks.filter(m => !m.submitted || m.score === null || m.score === undefined);

      // Calculate attendance rate
      let attendanceRate = 0;
      if (attendance.length > 0) {
        const present = attendance.filter(a => a.status === 'present').length;
        attendanceRate = Math.round((present / attendance.length) * 100);
      }

      console.log('📊 Final Stats:', {
        students: students.length,
        classes: classes.length,
        subjects: subjects.length,
        pendingMarks: pendingMarks.length,
        attendanceRate: attendanceRate
      });

      setStats({
        students: students.length,
        classes: classes.length,
        subjects: subjects.length,
        todayClasses: subjects.length,
        pendingMarks: pendingMarks.length,
        attendanceRate: attendanceRate
      });

    } catch (error) {
      console.error('❌ Error fetching teacher stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const cardData = [
    {
      title: 'My Students',
      value: stats.students,
      icon: <Users className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'My Classes',
      value: stats.classes,
      icon: <BookOpen className="w-6 h-6 text-green-500" />,
      color: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'My Subjects',
      value: stats.subjects,
      icon: <Award className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: "Today's Classes",
      value: stats.todayClasses,
      icon: <CalendarDays className="w-6 h-6 text-orange-500" />,
      color: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Pending Marks',
      value: stats.pendingMarks,
      icon: <ClipboardCheck className="w-6 h-6 text-red-500" />,
      color: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cardData.map((card, index) => (
        <div 
          key={index} 
          className={`bg-white rounded-xl border ${card.borderColor} p-6 shadow-sm hover:shadow-md transition`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
            <div className={`p-3 rounded-full ${card.color}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherDashboardCards;