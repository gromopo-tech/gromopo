"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface EmployeeSkill {
  rating: number;
  task: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  hours: number;
  skills: EmployeeSkill[]; // Update to use EmployeeSkill interface
  availability: Record<string, Record<string, string>>; // Add availability map
  active: boolean; // Add active field
}

interface Task {
  id: string;
  name: string;
  startTime: string;
  stopTime: string;
  days: string[]; // Array of days the task applies to (e.g., ["Monday", "Tuesday"])
}

interface EmployeeTask {
  taskId: string;
  startTime: string;
  stopTime: string;
}

interface DaySchedule {
  tasks: EmployeeTask[];
}

interface ScheduleEntry {
  employee: string;
  hours: number;
  [key: string]: string | number | DaySchedule;
}

export default function SchedulingPage() {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<Record<string, Record<string, DaySchedule>>>({});
  const [selectedCell, setSelectedCell] = useState<{employeeId: string, date: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get scheduling document
        const schedulingDocRef = doc(db, 'scheduling', user.uid);
        const schedulingDoc = await getDoc(schedulingDocRef);
        
        if (schedulingDoc.exists()) {
          const data = schedulingDoc.data();
          
          // Fetch employees
          if (data.employees && Array.isArray(data.employees)) {
            setEmployees(data.employees.map((emp: any, index: number) => ({
              id: index.toString(),
              firstName: emp.firstName || '',
              lastName: emp.lastName || '',
              hours: emp.hours || 0,
              skills: emp.skills || [],
              availability: emp.availability || {},
              active: emp.active !== false // Default to true if not specified
            })));
          } else {
            const employeesRef = collection(db, `scheduling/${user.uid}/employees`);
            const querySnapshot = await getDocs(employeesRef);
            const employeesData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              active: doc.data().active !== false // Default to true if not specified
            })) as Employee[];
            setEmployees(employeesData);
          }

          // Fetch tasks
          if (data.tasks && Array.isArray(data.tasks)) {
            const formattedTasks = data.tasks.map((task: any, index: number) => ({
              id: index.toString(),
              name: task.name || '',
              startTime: task.startTime || '',
              stopTime: task.stopTime || '',
              days: task.days || []
            }));
            console.log('Loaded tasks:', formattedTasks);
            setTasks(formattedTasks);
          }

          // Fetch schedule if it exists
          if (data.schedule) {
            setSchedule(data.schedule);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Start from Monday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      dates.push(current);
    }
    return dates;
  };

  const formatDateForStorage = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weekDates = getWeekDates(currentWeek);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const copyPreviousWeekSchedule = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const previousWeek = new Date(currentWeek);
      previousWeek.setDate(currentWeek.getDate() - 7);
      const previousWeekDates = getWeekDates(previousWeek);
      const currentWeekDates = getWeekDates(currentWeek);

      const updatedSchedule = { ...schedule };

      // For each employee, copy their schedule from previous week to current week
      employees.forEach(employee => {
        previousWeekDates.forEach((prevDate, index) => {
          const prevDateStr = prevDate.toISOString().split('T')[0];
          const currentDateStr = currentWeekDates[index].toISOString().split('T')[0];
          
          if (schedule[employee.id]?.[prevDateStr]) {
            if (!updatedSchedule[employee.id]) {
              updatedSchedule[employee.id] = {};
            }
            updatedSchedule[employee.id][currentDateStr] = {
              tasks: [...schedule[employee.id][prevDateStr].tasks]
            };
          }
        });
      });

      const schedulingDocRef = doc(db, 'scheduling', user.uid);
      await updateDoc(schedulingDocRef, {
        schedule: updatedSchedule
      });

      setSchedule(updatedSchedule);
    } catch (error) {
      console.error("Error copying previous week schedule:", error);
    }
  };

  const getDayName = (date: Date) => {
    // Create a new date object to avoid timezone issues
    const localDate = new Date(date);
    // Get the day name in the local timezone
    return localDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      timeZone: 'UTC' // Use UTC to avoid timezone shifts
    });
  };

  const isEmployeeAvailable = (employee: Employee, dayName: string, startTime: string, stopTime: string) => {
    const dayAvailability = employee.availability[dayName.toLowerCase()];
    if (!dayAvailability) {
      console.log(`No availability data for ${dayName.toLowerCase()}`);
      return false;
    }

    // Get all available time slots for the day
    const availableSlots = Object.entries(dayAvailability)
      .filter(([_, value]) => value !== '')
      .map(([time]) => time)
      .sort();

    if (availableSlots.length === 0) {
      return false;
    }

    // Find the earliest available time
    const earliestAvailable = availableSlots[0];
    // Find the latest available time (last slot + 1 hour)
    const lastSlot = availableSlots[availableSlots.length - 1];
    const [lastHour] = lastSlot.split(':').map(Number);
    const latestAvailable = `${(lastHour + 1).toString().padStart(2, '0')}:00`;

    // Convert all times to minutes for comparison
    const [taskStartHour, taskStartMin] = startTime.split(':').map(Number);
    const [taskStopHour, taskStopMin] = stopTime.split(':').map(Number);
    const [earliestHour, earliestMin] = earliestAvailable.split(':').map(Number);
    const [latestHour, latestMin] = latestAvailable.split(':').map(Number);

    const taskStartMinutes = taskStartHour * 60 + taskStartMin;
    const taskStopMinutes = taskStopHour * 60 + taskStopMin;
    const earliestMinutes = earliestHour * 60 + earliestMin;
    const latestMinutes = latestHour * 60 + latestMin;

    // Check if task is within available time range
    const isWithinRange = taskStartMinutes >= earliestMinutes && taskStopMinutes <= latestMinutes;
    
    if (!isWithinRange) {
      console.log(`Task time range (${startTime}-${stopTime}) is outside available range (${earliestAvailable}-${latestAvailable})`);
      return false;
    }

    return true;
  };

  const getAvailableTasksForDay = (dayName: string, employee: Employee) => {
    console.log('Checking tasks for:', {
      dayName,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeSkills: employee.skills,
      employeeAvailability: employee.availability[dayName.toLowerCase()]
    });

    const availableTasks = tasks.filter(task => {
      const hasDay = task.days && task.days.includes(dayName);
      const hasSkill = employee.skills.some(skill => skill.task === task.name);
      const isAvailable = isEmployeeAvailable(employee, dayName, task.startTime, task.stopTime);

      console.log('Task check:', {
        taskName: task.name,
        hasDay,
        hasSkill,
        isAvailable,
        taskDays: task.days,
        taskTimes: `${task.startTime}-${task.stopTime}`
      });

      return hasDay && hasSkill && isAvailable;
    });

    console.log('Available tasks:', availableTasks);
    return availableTasks;
  };

  const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const [start1Hour, start1Min] = start1.split(':').map(Number);
    const [end1Hour, end1Min] = end1.split(':').map(Number);
    const [start2Hour, start2Min] = start2.split(':').map(Number);
    const [end2Hour, end2Min] = end2.split(':').map(Number);

    const start1Total = start1Hour * 60 + start1Min;
    const end1Total = end1Hour * 60 + end1Min;
    const start2Total = start2Hour * 60 + start2Min;
    const end2Total = end2Hour * 60 + end2Min;

    return !(end1Total <= start2Total || start1Total >= end2Total);
  };

  const isTaskAlreadyScheduled = (employeeId: string, date: string, taskId: string) => {
    const employeeSchedule = schedule[employeeId]?.[date];
    if (!employeeSchedule) return false;
    return employeeSchedule.tasks.some(task => task.taskId === taskId);
  };

  const hasTimeOverlap = (employeeId: string, date: string, newTask: EmployeeTask) => {
    const employeeSchedule = schedule[employeeId]?.[date];
    if (!employeeSchedule) return false;

    return employeeSchedule.tasks.some(existingTask => {
      const existingTaskDetails = tasks.find(t => t.id === existingTask.taskId);
      if (!existingTaskDetails) return false;

      return isTimeOverlap(
        existingTaskDetails.startTime,
        existingTaskDetails.stopTime,
        newTask.startTime,
        newTask.stopTime
      );
    });
  };

  const handleAddTask = async (employeeId: string, date: string, taskId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Check for duplicate task
      if (isTaskAlreadyScheduled(employeeId, date, taskId)) {
        alert('This task is already scheduled for this employee on this day.');
        return;
      }

      const newTask: EmployeeTask = {
        taskId,
        startTime: task.startTime,
        stopTime: task.stopTime
      };

      // Check for time overlap
      if (hasTimeOverlap(employeeId, date, newTask)) {
        alert('This task overlaps with another task scheduled for this employee on this day.');
        return;
      }

      const updatedSchedule = { ...schedule };
      if (!updatedSchedule[employeeId]) {
        updatedSchedule[employeeId] = {};
      }
      if (!updatedSchedule[employeeId][date]) {
        updatedSchedule[employeeId][date] = { tasks: [] };
      }
      updatedSchedule[employeeId][date].tasks.push(newTask);

      const schedulingDocRef = doc(db, 'scheduling', user.uid);
      await updateDoc(schedulingDocRef, {
        schedule: updatedSchedule
      });

      setSchedule(updatedSchedule);
      setSelectedCell(null);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleRemoveTask = async (employeeId: string, date: string, taskIndex: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedSchedule = { ...schedule };
      updatedSchedule[employeeId][date].tasks.splice(taskIndex, 1);

      const schedulingDocRef = doc(db, 'scheduling', user.uid);
      await updateDoc(schedulingDocRef, {
        schedule: updatedSchedule
      });

      setSchedule(updatedSchedule);
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const getTotalHoursForEmployee = (employeeId: string) => {
    let totalHours = 0;
    const employeeSchedule = schedule[employeeId];
    if (!employeeSchedule) return 0;

    // Get all dates in the current week
    const currentWeekDates = weekDates.map(date => date.toISOString().split('T')[0]);

    // Only sum hours for tasks in the current week
    currentWeekDates.forEach(date => {
      if (employeeSchedule[date]?.tasks) {
        employeeSchedule[date].tasks.forEach((task) => {
          const [startHour, startMin] = task.startTime.split(':').map(Number);
          const [stopHour, stopMin] = task.stopTime.split(':').map(Number);
          const hours = stopHour - startHour + (stopMin - startMin) / 60;
          totalHours += hours;
        });
      }
    });

    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Employee Schedule</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="p-2 rounded-full hover:bg-gray-100 text-black"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-black">
            {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </span>
          <button
            onClick={() => navigateWeek("next")}
            className="p-2 rounded-full hover:bg-gray-100 text-black"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={copyPreviousWeekSchedule}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Copy Previous Week
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              {weekDates.map((date) => (
                <th key={date.toISOString()} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length > 0 ? (
              employees
                .filter(employee => employee.active)
                .map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{employee.lastName}</span>
                        <span className="text-gray-500">{employee.firstName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {getTotalHoursForEmployee(employee.id)}
                    </td>
                    {weekDates.map((date) => {
                      const dateStr = formatDateForStorage(date);
                      const dayName = getDayName(date);
                      const employeeSchedule = schedule[employee.id]?.[dateStr];
                      const employeeTasks = employeeSchedule?.tasks || [];
                      const availableTasks = getAvailableTasksForDay(dayName, employee);

                      return (
                        <td key={dateStr} className="px-3 py-2">
                          <div className="flex flex-col space-y-1">
                            {employeeTasks.map((task, index) => {
                              const taskDetails = tasks.find(t => t.id === task.taskId);
                              return (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-1 rounded">
                                  <div className="flex flex-col">
                                    <span className="text-xs">
                                      {task.startTime}-{task.stopTime}
                                    </span>
                                    <span className="text-xs font-medium">
                                      {taskDetails?.name || 'Unknown Task'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveTask(employee.id, dateStr, index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {availableTasks.length > 0 && (
                              <button
                                onClick={() => setSelectedCell({ employeeId: employee.id, date: dateStr })}
                                className="flex items-center justify-center w-full p-1 hover:text-gray-700 border border-dashed border-gray-300 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={9} className="px-3 py-2 text-center text-sm text-gray-500">
                  No employees found. Add employees to get started.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hours
              </td>
              <td className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {employees.reduce((sum, employee) => sum + getTotalHoursForEmployee(employee.id), 0)}
              </td>
              {weekDates.map((date) => (
                <td key={date.toISOString()} className="px-3 py-2"></td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Task Selection Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Task</h3>
            <select
              className="w-full p-2 border rounded mb-4"
              onChange={(e) => {
                if (e.target.value) {
                  handleAddTask(selectedCell.employeeId, selectedCell.date, e.target.value);
                }
              }}
            >
              <option value="">Select a task</option>
              {getAvailableTasksForDay(
                getDayName(new Date(selectedCell.date)),
                employees.find(e => e.id === selectedCell.employeeId) || {} as Employee
              ).map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name} ({task.startTime}-{task.stopTime})
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedCell(null)}
              className="w-full p-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}