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
  name: string;
}

interface DaySchedule {
  tasks: EmployeeTask[];
}

interface ScheduleEntry {
  employee: string;
  hours: number;
  [key: string]: string | number | DaySchedule;
}

type EmployeeSchedule = Record<string, DaySchedule>; // Maps day of week to tasks for an employee
type WeekSchedule = Record<string, EmployeeSchedule>; // Maps employeeId to their schedule
type Schedules = Record<string, WeekSchedule>; // Maps week start date to week schedule

export default function SchedulingPage() {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedules>({});
  const [selectedCell, setSelectedCell] = useState<{employeeIndex: number, date: string} | null>(null);
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [customTaskName, setCustomTaskName] = useState("");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customStopTime, setCustomStopTime] = useState("");

  // Generate time options for the custom task form
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });

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
            setEmployees(data.employees.map((emp: any) => ({
              id: emp.id, // Use the actual employee ID
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

          // Fetch tasks and custom tasks from schedule
          const allTasks = new Set<Task>();
          
          // Add regular tasks
          if (data.tasks && Array.isArray(data.tasks)) {
            data.tasks.forEach((task: any) => {
              allTasks.add({
                id: task.id,
                name: task.name || '',
                startTime: task.startTime || '',
                stopTime: task.stopTime || '',
                days: task.days || []
              });
            });
          }

          // Add custom tasks from schedule
          if (data.schedule) {
            Object.values(data.schedule).forEach((employeeSchedule: any) => {
              Object.values(employeeSchedule).forEach((daySchedule: any) => {
                if (daySchedule.tasks) {
                  daySchedule.tasks.forEach((task: EmployeeTask) => {
                    // Only add if it's a custom task (not in regular tasks)
                    if (!Array.from(allTasks).some(t => t.id === task.taskId)) {
                      allTasks.add({
                        id: task.taskId,
                        name: task.name,
                        startTime: task.startTime,
                        stopTime: task.stopTime,
                        days: [getDayName(new Date())] // Default to current day
                      });
                    }
                  });
                }
              });
            });
          }

          setTasks(Array.from(allTasks));

          // Fetch schedule if it exists
          if (data.schedule) {
            setSchedules(data.schedule);
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

  const getWeekStartDate = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Start from Monday
    return start;
  };

  const formatWeekStartDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentSchedule = () => {
    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
    return schedules[weekStartDate] || {};
  };

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
      const prevWeekStartDate = formatWeekStartDate(getWeekStartDate(previousWeek));
      const currentWeekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));

      const updatedSchedules = { ...schedules };

      // For each employee, copy their schedule from previous week to current week
      employees.forEach((employee) => {
        previousWeekDates.forEach((prevDate, prevIndex) => {
          const prevDateStr = formatDateForStorage(prevDate);
          const currentDateStr = formatDateForStorage(currentWeekDates[prevIndex]);
          
          if (schedules[prevWeekStartDate]?.[employee.id]?.[prevDateStr]) {
            if (!updatedSchedules[currentWeekStartDate]) {
              updatedSchedules[currentWeekStartDate] = {};
            }
            if (!updatedSchedules[currentWeekStartDate][employee.id]) {
              updatedSchedules[currentWeekStartDate][employee.id] = {};
            }
            updatedSchedules[currentWeekStartDate][employee.id][currentDateStr] = {
              tasks: [...schedules[prevWeekStartDate][employee.id][prevDateStr].tasks]
            };
          }
        });
      });

      const schedulingDocRef = doc(db, 'scheduling', user.uid);
      await updateDoc(schedulingDocRef, {
        schedules: updatedSchedules
      });

      setSchedules(updatedSchedules);
    } catch (error) {
      console.error("Error copying previous week schedule:", error);
    }
  };

  const getDayName = (date: Date | undefined) => {
    if (!date) return "Sun"; // Default to Sunday if date is undefined
    // Create a new date object to avoid timezone issues
    const localDate = new Date(date);
    // Get the day of week (0-6, where 0 is Sunday)
    const dayOfWeek = localDate.getDay();
    // Map to our standard day names (must match exactly with tasks page)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = dayNames[dayOfWeek];
    return dayName;
  };

  const isEmployeeAvailable = (employee: Employee, dayName: string, startTime: string, stopTime: string) => {
    const dayAvailability = employee.availability[dayName.toLowerCase()];
    if (!dayAvailability) {
      console.log(`No availability data for ${dayName.toLowerCase()}`);
      return false;
    }

    // Get all available time slots for the day
    const availableSlots: string[] = Object.entries(dayAvailability)
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
    // Convert dayName to match the format used in tasks (e.g., "Tue" instead of "Tuesday")
    const formattedDayName = dayName.substring(0, 3);
    
    // Filter tasks by day and employee skills
    const availableTasks = tasks.filter(task => {
      const hasDay = task.days && task.days.includes(formattedDayName);
      const hasSkill = employee.skills.some(skill => skill.task === task.name);
      return hasDay && hasSkill;
    });

    // Sort tasks alphabetically by name
    return availableTasks.sort((a, b) => a.name.localeCompare(b.name));
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
    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
    const daySchedule = schedules[weekStartDate]?.[employeeId]?.[date];
    if (!daySchedule) return false;
    return daySchedule.tasks.some(task => task.taskId === taskId);
  };

  const hasTimeOverlap = (employeeId: string, date: string, newTask: EmployeeTask) => {
    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
    const daySchedule = schedules[weekStartDate]?.[employeeId]?.[date];
    if (!daySchedule) return false;

    return daySchedule.tasks.some(existingTask => {
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

  const handleAddTask = async (employeeIndex: number, date: string, taskId: string, isCustom: boolean = false) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (employeeIndex < 0 || employeeIndex >= employees.length) {
        console.error('Invalid employee index:', employeeIndex);
        return;
      }

      const employee = employees[employeeIndex];
      if (!employee) {
        console.error('Employee not found at index:', employeeIndex);
        return;
      }

      let task: Task;
      if (isCustom) {
        // Create a new task object for the custom task
        const customTaskId = crypto.randomUUID();
        const currentDate = weekDates.find(d => formatDateForStorage(d) === date);
        task = {
          id: customTaskId,
          name: customTaskName,
          startTime: customStartTime,
          stopTime: customStopTime,
          days: [getDayName(currentDate || new Date())]
        };
      } else {
        const foundTask = tasks.find(t => t.id === taskId);
        if (!foundTask) return;
        task = foundTask;
      }
      
      // Check for duplicate task
      if (isTaskAlreadyScheduled(employee.id, date, task.id)) {
        alert('This task is already scheduled for this employee on this day.');
        return;
      }

      const newTask: EmployeeTask = {
        taskId: task.id,
        startTime: task.startTime,
        stopTime: task.stopTime,
        name: task.name
      };

      // Check for time overlap
      if (hasTimeOverlap(employee.id, date, newTask)) {
        alert('This task overlaps with another task scheduled for this employee on this day.');
        return;
      }

      // Check if task times are within employee availability
      const dayName = getDayName(weekDates.find(d => formatDateForStorage(d) === date) || new Date());
      const dayAvailability = employee.availability[dayName.toLowerCase()];
      
      if (dayAvailability) {
        const [startHour, startMin] = task.startTime.split(':').map(Number);
        const [stopHour, stopMin] = task.stopTime.split(':').map(Number);
        
        // Convert task times to minutes for easier comparison
        const taskStartMinutes = startHour * 60 + startMin;
        const taskStopMinutes = stopHour * 60 + stopMin;
        
        // Get all available time slots for the day
        const availableSlots: string[] = Object.entries(dayAvailability)
          .filter(([_, value]) => value !== '')
          .map(([time]) => time)
          .sort();
        
        if (availableSlots.length > 0) {
          const earliestAvailable = availableSlots[0];
          const latestAvailable = availableSlots[availableSlots.length - 1];
          
          // Convert times to minutes for comparison
          const [taskStartHour, taskStartMin] = task.startTime.split(':').map(Number);
          const [taskStopHour, taskStopMin] = task.stopTime.split(':').map(Number);
          const [earliestHour, earliestMin] = earliestAvailable.split(':').map(Number);
          const [latestHour, latestMin] = latestAvailable.split(':').map(Number);
          
          const taskStartMinutes = taskStartHour * 60 + taskStartMin;
          const taskStopMinutes = taskStopHour * 60 + stopMin;
          const earliestMinutes = earliestHour * 60 + earliestMin;
          const latestMinutes = (latestHour + 1) * 60 + latestMin; // Add one hour to the end time
          
          if (taskStartMinutes < earliestMinutes || taskStopMinutes > latestMinutes) {
            const latestTime = `${(latestHour + 1).toString().padStart(2, '0')}:${latestMin.toString().padStart(2, '0')}`;
            
            if (!confirm(`Warning: This task (${task.startTime}-${task.stopTime}) falls outside the employee's available hours (${earliestAvailable}-${latestTime}). Do you want to proceed anyway?`)) {
              return;
            }
          }
        }
      }

      // Add the task to the schedule in Firestore
      const schedulingDocRef = doc(db, 'scheduling', user.uid);
      const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
      const updatedSchedules = { ...schedules };
      
      if (!updatedSchedules[weekStartDate]) {
        updatedSchedules[weekStartDate] = {};
      }
      
      if (!updatedSchedules[weekStartDate][employee.id]) {
        updatedSchedules[weekStartDate][employee.id] = {};
      }
      
      if (!updatedSchedules[weekStartDate][employee.id][date]) {
        updatedSchedules[weekStartDate][employee.id][date] = { tasks: [] };
      }
      
      // Add the new task and sort by start time
      updatedSchedules[weekStartDate][employee.id][date].tasks.push(newTask);
      updatedSchedules[weekStartDate][employee.id][date].tasks.sort((a, b) => {
        const [aHour, aMin] = a.startTime.split(':').map(Number);
        const [bHour, bMin] = b.startTime.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });
      
      await updateDoc(schedulingDocRef, {
        schedules: updatedSchedules
      });
      
      // Update local state
      setSchedules(updatedSchedules);
      if (isCustom) {
        setTasks(prevTasks => [...prevTasks, task]);
      }
      setSelectedCell(null);
      setIsCustomTask(false);
      setCustomTaskName("");
      setCustomStartTime("");
      setCustomStopTime("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleRemoveTask = async (employeeIndex: number, date: string, taskIndex: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const employee = employees[employeeIndex];
      if (!employee) return;

      const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
      const updatedSchedules = { ...schedules };
      updatedSchedules[weekStartDate][employee.id][date].tasks.splice(taskIndex, 1);

      const schedulingDocRef = doc(db, 'scheduling', user.uid);
      await updateDoc(schedulingDocRef, {
        schedules: updatedSchedules
      });

      setSchedules(updatedSchedules);
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const getTotalHoursForEmployee = (employeeIndex: number) => {
    const employee = employees[employeeIndex];
    if (!employee) return 0;

    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
    const employeeSchedule = schedules[weekStartDate]?.[employee.id];
    if (!employeeSchedule) return 0;

    let totalHours = 0;
    // Get all dates in the current week
    const currentWeekDates = weekDates.map(date => formatDateForStorage(date));

    // Sum hours for tasks in the current week
    currentWeekDates.forEach(date => {
      const daySchedule = employeeSchedule[date];
      if (daySchedule?.tasks) {
        daySchedule.tasks.forEach((task) => {
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
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="flex-1 overflow-x-auto">
        <div className="bg-white rounded-lg shadow">
          <table className="w-full divide-y divide-gray-200">
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
                  .map((employee, index) => {
                    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek));
                    const employeeSchedule = schedules[weekStartDate]?.[employee.id];
                    return (
                      <tr key={employee.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{employee.lastName}</span>
                            <span className="text-gray-500">{employee.firstName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {getTotalHoursForEmployee(index)}
                        </td>
                        {weekDates.map((date) => {
                          const dateStr = formatDateForStorage(date);
                          const dayName = getDayName(date);
                          const daySchedule = employeeSchedule?.[dateStr];
                          const employeeTasks = daySchedule?.tasks || [];
                          const availableTasks = getAvailableTasksForDay(dayName, employee);

                          return (
                            <td key={`${employee.id}-${dateStr}`} className="px-3 py-2">
                              <div className="flex flex-col space-y-1">
                                {employeeTasks.map((task, taskIndex) => {
                                  const taskDetails = tasks.find(t => t.id === task.taskId);
                                  return (
                                    <div key={`${employee.id}-${dateStr}-${task.taskId}-${taskIndex}`} className="flex items-center justify-between bg-gray-50 p-1 rounded">
                                      <div className="flex flex-col">
                                        <span className="text-xs">
                                          {task.startTime}-{task.stopTime}
                                        </span>
                                        <span className="text-xs font-medium">
                                          {taskDetails?.name || 'Unknown Task'}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveTask(index, dateStr, taskIndex)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  );
                                })}
                                {/* Always show the add task button */}
                                <button
                                  onClick={() => setSelectedCell({ employeeIndex: index, date: dateStr })}
                                  className="flex items-center justify-center w-full p-1 text-gray-500 hover:bg-gray-100 border border-dashed border-gray-300 rounded transition-colors duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
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
                  {employees.reduce((sum, _, index) => sum + getTotalHoursForEmployee(index), 0)}
                </td>
                {weekDates.map((date) => (
                  <td key={date.toISOString()} className="px-3 py-2"></td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Task Selection Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Task</h3>
            {!isCustomTask ? (
              <>
                <select
                  key={`task-select-${selectedCell.employeeIndex}-${selectedCell.date}`}
                  className="w-full p-2 border rounded mb-4"
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setIsCustomTask(true);
                    } else if (e.target.value) {
                      handleAddTask(selectedCell.employeeIndex, selectedCell.date, e.target.value);
                    }
                  }}
                >
                  <option key="default" value="">Select a task</option>
                  <option key="custom" value="custom">CUSTOM TASK</option>
                  {getAvailableTasksForDay(
                    getDayName(weekDates.find(date => formatDateForStorage(date) === selectedCell.date) || new Date()),
                    employees[selectedCell.employeeIndex]
                  ).map((task) => (
                    <option key={`${selectedCell.employeeIndex}-${selectedCell.date}-${task.id}`} value={task.id}>
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
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                  <input
                    type="text"
                    value={customTaskName}
                    onChange={(e) => setCustomTaskName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter task name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <select
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select start time</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <select
                      value={customStopTime}
                      onChange={(e) => setCustomStopTime(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select end time</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!customTaskName.trim()) {
                        alert("Task name is required.");
                        return;
                      }
                      if (!customStartTime) {
                        alert("Start time is required.");
                        return;
                      }
                      if (!customStopTime) {
                        alert("End time is required.");
                        return;
                      }
                      if (customStartTime >= customStopTime) {
                        alert("Start time must be before end time.");
                        return;
                      }
                      handleAddTask(selectedCell.employeeIndex, selectedCell.date, "", true);
                    }}
                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Custom Task
                  </button>
                  <button
                    onClick={() => {
                      setIsCustomTask(false);
                      setCustomTaskName("");
                      setCustomStartTime("");
                      setCustomStopTime("");
                    }}
                    className="flex-1 p-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}