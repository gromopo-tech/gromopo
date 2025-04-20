"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  hours: number;
}

interface Task {
  id: string;
  name: string;
  startTime: string;
  stopTime: string;
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
              hours: emp.hours || 0
            })));
          } else {
            const employeesRef = collection(db, `scheduling/${user.uid}/employees`);
            const querySnapshot = await getDocs(employeesRef);
            const employeesData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Employee[];
            setEmployees(employeesData);
          }

          // Fetch tasks
          if (data.tasks && Array.isArray(data.tasks)) {
            setTasks(data.tasks.map((task: any, index: number) => ({
              id: index.toString(),
              name: task.name || '',
              startTime: task.startTime || '',
              stopTime: task.stopTime || ''
            })));
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

  const weekDates = getWeekDates(currentWeek);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const handleAddTask = async (employeeId: string, date: string, taskId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newTask: EmployeeTask = {
        taskId,
        startTime: task.startTime,
        stopTime: task.stopTime
      };

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
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              {weekDates.map((date) => (
                <th key={date.toISOString()} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.lastName}, {employee.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.hours || 0}
                  </td>
                  {weekDates.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const employeeSchedule = schedule[employee.id]?.[dateStr];
                    const employeeTasks = employeeSchedule?.tasks || [];

                    return (
                      <td key={dateStr} className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {employeeTasks.map((task, index) => {
                            const taskDetails = tasks.find(t => t.id === task.taskId);
                            return (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">
                                  {taskDetails?.name || 'Unknown Task'}
                                  ({task.startTime}-{task.stopTime})
                                </span>
                                <button
                                  onClick={() => handleRemoveTask(employee.id, dateStr, index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => setSelectedCell({ employeeId: employee.id, date: dateStr })}
                            className="flex items-center justify-center w-full p-2 hover:text-gray-700 border border-dashed border-gray-300 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                  No employees found. Add employees to get started.
                </td>
              </tr>
            )}
          </tbody>
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
              {tasks.map((task) => (
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