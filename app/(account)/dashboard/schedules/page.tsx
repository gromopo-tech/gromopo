"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus} from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc, updateDoc} from "firebase/firestore";
import { formatTimeDisplay } from "@/lib/timeUtils";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { connect } from "http2";

interface EmployeeSkill {
  name: string;
  rating: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  hours: number;
  skills: EmployeeSkill[];
  availability: Record<string, Record<string, string>>;
  active: boolean;
}

interface Task {
  name: string;
  startTime: string;
  stopTime: string;
}

interface DaySchedule {
  tasks: Task[];
}

type EmployeeSchedule = Record<string, DaySchedule>; // Maps day of week to tasks for an employee
type WeekSchedule = Record<string, EmployeeSchedule>; // Maps employeeId to their schedule
type Schedules = Record<string, WeekSchedule>; // Maps week start date to week schedule

export default function SchedulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = auth.currentUser!;
  const userRef = doc(db, "users", user.uid);
  const [startDay, setStartDay] = useState<string>("sun"); // Default to Sunday
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedules>({});
  const [selectedCell, setSelectedCell] = useState<{employeeId: string, date: string} | null>(null);
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [daysOff, setDaysOff] = useState<{ employeeName: string; date: string; timeOffType?: string }[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [taskInProgress, setTaskInProgress] = useState<Task>({
    name: "",
    startTime: "",
    stopTime: "",
  });

  const fetchDaysOff = async () => {
    try {
      const response = await fetch("/api/calendar");
      const data = await response.json();
  
      if (data.authUrl) {
        window.location.href = data.authUrl; // Redirect to Google authentication
      } else {
        const fetchedDaysOff = data.events.map((event: any) => ({
          employeeName: event.summary,
          date: event.start.date || event.start.dateTime,
        }));
        // Process days off and update the schedule
        console.log(fetchedDaysOff);
        setDaysOff(fetchedDaysOff);
        setIsCalendarConnected(true);
      }
    } catch (error) {
      console.error("Error fetching days off:", error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStartDay(data.settings?.startDay || "sun"); // Default to Sunday if no settings exist
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);
  
  useEffect(() => {
    const fetchFirebaseData = async () => {
      try {
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Fetch employees
          if (data.employees && Array.isArray(data.employees)) {
            setEmployees(data.employees.map((emp: any) => ({
              id: emp.id,
              firstName: emp.firstName || '',
              lastName: emp.lastName || '',
              hours: emp.hours || 0,
              skills: emp.skills || [],
              availability: emp.availability || {},
              active: emp.active !== false
            }))
            .filter((emp, index, self) => self.findIndex(e => e.id === emp.id) === index)
          );
          } else {
            const employeesRef = collection(db, `users/${user.uid}/employees`);
            const querySnapshot = await getDocs(employeesRef);
            const employeesData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              active: doc.data().active !== false
            })) as Employee[];
            setEmployees(employeesData);
          }

          // Ensure `data.schedules` is typed as `Schedules`
          const schedulesData = data.schedules as Schedules;

          // Remove schedules for employees that no longer exist
          const validEmployeeIds = new Set(data.employees.map((emp: any) => emp.id));
          const cleanedSchedules = Object.fromEntries(
            Object.entries(schedulesData || {}).map(([weekStartDate, weekSchedule]) => [
              weekStartDate,
              Object.fromEntries(
                Object.entries(weekSchedule).filter(([employeeId]) => validEmployeeIds.has(employeeId))
              ),
            ])
          );
          setSchedules(cleanedSchedules);
          }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchFirebaseData();
  }, [currentWeek]);

  // Process fetchedDaysOff from the query parameter
  useEffect(() => {
    const fetchedDaysOff = searchParams.get("fetchedDaysOff");

    if (fetchedDaysOff) {
      try {
        const events = JSON.parse(fetchedDaysOff);
        const processedDaysOff: { timeOffType: string; employeeName: string; date: string }[] = [];

        events.forEach((event: any) => {
          const [timeOffType, employeeName] = event.summary.split(": ").map((part: string) => part.trim());
          const startDate = new Date(event.start.date);
          const endDate = new Date(event.end.date);

          // Generate all dates in the range [startDate, endDate)
          for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
            processedDaysOff.push({
              timeOffType,
              employeeName,
              date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
            });
          }
        });

        setDaysOff(processedDaysOff);
        setIsCalendarConnected(true);
      } catch (error) {
        console.error("Error processing fetchedDaysOff:", error);
      }
    }
  }, [searchParams]);

  const getWeekStartDate = (date: Date, startDay: string) => {
    const start = new Date(date);
    const dayOfWeek = start.getDay();
    const startDayIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(startDay);
    const diff = (dayOfWeek - startDayIndex + 7) % 7; // Calculate the difference
    start.setDate(start.getDate() - diff);
    return start;
  };

  const formatWeekStartDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTaskName = (name: string) => {
    if (!name) return ['Unknown Task'];
    const parts = name.split(/ \//);
    if (parts.length === 1) return parts;
    return [parts[0], `${parts.slice(1).join('/')}`];
  };

  const getWeekDates = (date: Date, startDay: string) => {
    const start = getWeekStartDate(date, startDay);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      dates.push(current);
    }
    return dates;
  };
  const weekDates = getWeekDates(currentWeek, startDay);

  const formatDateForStorage = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fullDayName = (day: string) => {
    const lowerCaseDay = day.toLowerCase();
    const dayNames = {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday"
    };
    return dayNames[lowerCaseDay as keyof typeof dayNames] || "Unknown Day";
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const copyPreviousWeekSchedule = async () => {
    try {
      const previousWeek = new Date(currentWeek);
      previousWeek.setDate(currentWeek.getDate() - 7);
      const previousWeekDates = getWeekDates(previousWeek, startDay);
      const currentWeekDates = getWeekDates(currentWeek, startDay);
      const prevWeekStartDate = formatWeekStartDate(getWeekStartDate(previousWeek, startDay));
      const currentWeekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek, startDay));
  
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
  
      await updateDoc(userRef, {
        schedules: updatedSchedules
      });
  
      setSchedules(updatedSchedules);
    } catch (error) {
      console.error("Error copying previous week schedule:", error);
    }
  };

  const getDayName = (date: Date): string => {
    // Ensure the date is in the local timezone
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = localDate.getDay();
    
    // Map to our standard day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNames[dayOfWeek];
  };

  const handlePrintSchedule = () => {
    const printContent = document.getElementById("schedule-table")?.cloneNode(true) as HTMLElement;
    if (!printContent) return;
  
    // Remove trash and "+" buttons from the cloned content
    printContent.querySelectorAll("button").forEach((button) => button.remove());
  
    // Ensure employee names are structured correctly for printing
    printContent.querySelectorAll("td.employee-column").forEach((row) => {
      const employeeContainer = row.querySelector(".flex.flex-col");
      if (employeeContainer) {
        const lastName = employeeContainer.querySelector("span:first-child")?.textContent || "";
        const firstName = employeeContainer.querySelector("span:last-child")?.textContent || "";

        // Replace the content with structured spans for printing
        employeeContainer.innerHTML = `
          <div class="employee-name">
            <span class="last-name">${lastName}</span>
            <span class="first-name">${firstName}</span>
          </div>
        `;
      }
    });

    // Ensure tasks are structured correctly for printing
    printContent.querySelectorAll("td").forEach((td) => {
      const taskContainer = td.querySelector(".flex.flex-col");
      if (taskContainer) {
        taskContainer.querySelectorAll(".flex.items-center").forEach((taskElement) => {
          const timeSpan = taskElement.querySelector("span:nth-child(1)");
          const nameSpan = taskElement.querySelector("span:nth-child(2)");

          if (timeSpan && nameSpan) {
            const taskName = nameSpan.textContent || "";
            const skillRating = taskElement.className.match(/text-(red|blue)-500/);
            const colorStyle = skillRating ? (skillRating[1] === "red" ? "color: red;" : "color: blue;") : "color: black;";

            // Update the task structure for printing
            taskElement.innerHTML = `
              <div class="task" style="${colorStyle}">
                <span class="task-time" style="font-weight: bold;">${timeSpan.textContent}</span><br />
                <span class="task-name" style="font-style: italic;">${taskName}</span>
              </div>
            `;
          }
        });
      }
    });

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
  
    // Dynamically create and append content to the new window
    const doc = printWindow.document;

    // Create the HTML structure
    const html = doc.createElement("html");
    const head = doc.createElement("head");
    const body = doc.createElement("body");

    // Add title
    const title = doc.createElement("title");
    title.textContent = "Print Schedule";
    head.appendChild(title);

    // Add styles
    const style = doc.createElement("style");
    style.textContent = `
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f4f4f4;
      }
      td.employee-column .employee-name {
        display: flex;
        flex-direction: column;
      }
      td.employee-column .employee-name .last-name {
        font-weight: bold;
      }
      td.employee-column .employee-name .first-name {
        color: gray;
      }
      td .task {
        margin-bottom: 8px; /* Add space between tasks */
      }
      td .task-time {
        font-weight: bold;
      }
      td .task-name {
        font-style: italic;
      }
      tfoot {
        display: table-row-group; /* Ensure the footer only appears at the end of the table */
      }
      tr {
        page-break-inside: avoid; /* Prevent page breaks inside a row */
      }
      tr.employee-row {
        break-inside: avoid; /* Prevent page breaks inside an employee's row */
      }
      @media print {
        tr.employee-row {
          page-break-before: auto; /* Automatically add a page break if the row doesn't fit */
        }
      }
      /* Adjust column widths */
      th:nth-child(1), td:nth-child(1) {
        width: 10%; /* Employee column */
      }
      th:nth-child(2), td:nth-child(2) {
        width: 6%; /* Hours column */
      }
      th:nth-child(n+3), td:nth-child(n+3) {
        width: 12%; /* Date columns */
      }
    `;
    head.appendChild(style);
    
    // Add content to the body
    const heading = doc.createElement("h2");
    heading.textContent = `Schedule for ${weekDates[0].toLocaleDateString()} - ${weekDates[6].toLocaleDateString()}`;
    body.appendChild(heading);
    
    // Append the cloned table
    body.appendChild(printContent);
    
    // Append head and body to the HTML
    html.appendChild(head);
    html.appendChild(body);
    
    // Replace the document content
    doc.replaceChild(html, doc.documentElement);

    printWindow.print();
  };

  // Helper function to create a task object
  const createTask = (name: string, startTime: string, stopTime: string): Task => {
    return {
      name: name.toUpperCase(), // Ensure task name is uppercase
      startTime,
      stopTime,
    };
  };

  const updateTaskInProgress = (field: keyof Task, value: string) => {
    setTaskInProgress((prev) => ({
      ...prev,
      [field]: field === "name" ? value.toUpperCase() : value, // Ensure task name is uppercase
    }));
  };
  
  const isTaskWithinAvailability = (employee: Employee, task: Task, day: string): boolean => {
    const startHour = parseInt(task.startTime.split(":")[0], 10);
    const stopHour = parseInt(task.stopTime.split(":")[0], 10);
  
    const availability = employee.availability[day];
    for (let hour = startHour; hour < stopHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
      if (!availability[timeSlot] || availability[timeSlot] === "") {
        return false; // Time slot is unavailable
      }
    }
  
    return true; // All time slots are available
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

    const overlap = !(end1Total <= start2Total || start1Total >= end2Total);
    console.log(`Comparing times: [${start1}-${end1}] with [${start2}-${end2}] => Overlap: ${overlap}`);
    return overlap;
  };

  const hasTimeOverlap = (employeeId: string, date: string, newTask: Task) => {
    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek, startDay));
    const employeeSchedule = schedules[weekStartDate]?.[employeeId];
    if (!employeeSchedule) {
      console.log(`No schedule found for employeeId: ${employeeId} on weekStartDate: ${weekStartDate}`);
      return false;
    }
  
    // Get the schedule for the given 
    const daySchedule = employeeSchedule[date];
    if (!daySchedule || !daySchedule.tasks) {
      console.log(`No tasks found for employeeId: ${employeeId} on dayName: ${date}`);
      return false;
    }

    console.log(`Checking for overlaps on dayName: ${date} for employeeId: ${employeeId}`);
    console.log(`Existing tasks:`, daySchedule.tasks);
    console.log(`New task:`, newTask);

    // Iterate over all tasks for the given dayName
    return daySchedule.tasks.some(task => {
      const overlap = isTimeOverlap(
        task.startTime,
        task.stopTime,
        newTask.startTime,
        newTask.stopTime
      );
      if (overlap) {
        console.log(`Overlap found with task:`, task);
      }
      return overlap;
    });
  };

  // Helper function to validate task inputs
  const validateTask = (task: Task): string | null => {
    if (!task.name.trim()) return "Task name is required.";
    if (!task.startTime) return "Start time is required.";
    if (!task.stopTime) return "End time is required.";
    if (task.startTime >= task.stopTime) return "Start time must be before end time.";
    return null;
  };

  const handleAddTask = async (employeeId: string, date: string, taskName: string, isCustom: boolean = false) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        console.error('Employee not found with ID:', employeeId);
        return;
      }

      const task: Task = isCustom
        ? { ...taskInProgress }
        : createTask(taskName, "09:00", "17:00"); // Default times for skill-based tasks


      // validate task
      const error = validateTask(task);
      if (error) {
        alert(error);
        return;
      }

      const taskDate = new Date(date);
      const dayName = getDayName(taskDate).toLowerCase();
      const formattedDay = fullDayName(dayName);

      // Check if the task is within the employee's availability
      if (!isTaskWithinAvailability(employee, task, dayName)) {
        const proceed = window.confirm(
          `Warning: This task is outside of ${employee.firstName} ${employee.lastName}'s availability on ${formattedDay + 's'}. Do you want to proceed anyway?`
        );
        if (!proceed) return null;
      }

      // Check for time overlap
      if (hasTimeOverlap(employee.id, date, task)) {
        const proceed = window.confirm(
          `Warning: This task overlaps with another task scheduled for ${employee.firstName} ${employee.lastName} on ${formattedDay}. Do you want to proceed anyway?`
        );
        if (!proceed) return null;
      }

      // Add the task to the schedule in Firestore
      const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek, startDay));
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
      updatedSchedules[weekStartDate][employee.id][date].tasks.push(task);
      updatedSchedules[weekStartDate][employee.id][date].tasks.sort((a, b) => {
        const [aHour, aMin] = a.startTime.split(':').map(Number);
        const [bHour, bMin] = b.startTime.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });
      
      await updateDoc(userRef, {
        schedules: updatedSchedules
      });
      
      // Update local state
      setSchedules(updatedSchedules);
      setSelectedCell(null);
      setIsCustomTask(false);
      setTaskInProgress({ name: "", startTime: "", stopTime: "" });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleRemoveTask = async (employeeId: string, date: string, taskIndex: number) => {
    try {
      const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek, startDay));
      const updatedSchedules = { ...schedules };
      // Check if the schedule exists before trying to remove the task
      if (
        updatedSchedules[weekStartDate] &&
        updatedSchedules[weekStartDate][employeeId] &&
        updatedSchedules[weekStartDate][employeeId][date] &&
        updatedSchedules[weekStartDate][employeeId][date].tasks
      ) {
        updatedSchedules[weekStartDate][employeeId][date].tasks.splice(taskIndex, 1);

        await updateDoc(userRef, {
          schedules: updatedSchedules
        });
      
        setSchedules(updatedSchedules);
      }
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const getTotalHoursForEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return 0;
    
    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek, startDay));
    const employeeSchedule = schedules[weekStartDate]?.[employeeId];
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
  
    return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
  };

  // Add a helper function to determine the color based on skill rating
  const getSkillColor = (rating: number): string => {
    switch (rating) {
      case 1:
        return "text-red-500";
      case 4:
        return "text-blue-500";
      default:
        return "text-gray-900";
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
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Employee Schedule</h2>
        <div className="flex items-center space-x-4">
          {!isCalendarConnected && (
            <button
              onClick={fetchDaysOff}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              Connect Calendar
            </button>
          )}
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
          <button
            onClick={handlePrintSchedule}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Print Schedule
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div id="schedule-table" className="bg-white rounded-lg shadow">
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
                    const uniqueKey = `${employee.id}-${index}`;
                    const weekStartDate = formatWeekStartDate(getWeekStartDate(currentWeek, startDay));
                    const employeeSchedule = schedules[weekStartDate]?.[employee.id];
                    return (
                      <tr key={uniqueKey}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 employee-column">
                          <div className="flex flex-col">
                            <span>{employee.lastName}</span>
                            <span className="text-gray-500">{employee.firstName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {getTotalHoursForEmployee(employee.id).toFixed(2)}
                        </td>
                        {weekDates.map((date) => {
                          const dateStr = formatDateForStorage(date);
                          const isDayOff = daysOff.some(
                            (off) => 
                              off.date === dateStr && 
                              off.employeeName === `${employee.lastName}, ${employee.firstName}`
                          );
                          const daySchedule = employeeSchedule?.[dateStr];
                          const employeeTasks = daySchedule?.tasks || [];

                          return (
                            <td 
                              key={`${employee.id}-${dateStr}`} 
                              className={`px-3 py-2 ${isDayOff ? "bg-red-100" : ""}`}
                            >
                              <div className="flex flex-col space-y-1">
                                {isDayOff && (
                                  <div className="text-xs font-bold text-red-500 text-center">
                                    {daysOff.find(off => off.date === dateStr && off.employeeName === `${employee.lastName}, ${employee.firstName}`)?.timeOffType?.toUpperCase() || "Day Off"}
                                  </div>
                                )}
                                {employeeTasks.map((task, taskIndex) => {
                                  const skill = employee.skills.find(skill => skill.name.toLowerCase() === task.name.toLowerCase());
                                  const skillColor = skill ? getSkillColor(skill.rating) : "text-gray-900";

                                  return (
                                    <div 
                                      key={`${employee.id}-${dateStr}-${task.name}-${taskIndex}`} 
                                      className={`flex items-center justify-between bg-gray-50 p-1 rounded ${skillColor}`}
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-xs">
                                          {formatTimeDisplay(task.startTime)}-{formatTimeDisplay(task.stopTime)}
                                        </span>
                                        <span className="text-xs font-medium">
                                          {formatTaskName(task.name || task.name).map((part, i) => (
                                            <React.Fragment key={i}>
                                              {i > 0 ? '/ ' : ''}{part}
                                              {i === 0 && task.name.includes('/ ') && <br />}
                                            </React.Fragment>
                                          ))}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveTask(employee.id, dateStr, taskIndex)}
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
                                  onClick={() => {
                                    const selectedEmployee = employees.find(emp => emp.id === employee.id);
                                    if (!selectedEmployee) {
                                      console.error("Employee not found");
                                      return; // Exit early if no employee is found
                                    }
                                    const dayName = getDayName(weekDates.find(date => formatDateForStorage(date) === dateStr) || new Date()).toLowerCase();
                                    const dayAvailability = selectedEmployee?.availability[dayName];
                                  
                                    // Check if the employee is unavailable
                                    const isAvailable = dayAvailability && Object.values(dayAvailability).some(value => value !== '');
                                  
                                    if (!isAvailable) {
                                      const proceed = window.confirm(
                                        `Warning: This employee is unavailable on ${fullDayName(dayName) + "s"}. Do you want to proceed anyway?`
                                      );
                                      if (!proceed) return;
                                    }
                                  
                                    setSelectedCell({ employeeId: selectedEmployee.id, date: dateStr });
                                  }}
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
                  Total <br /> Hours
                </td>
                <td className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                {employees
                  .filter(emp => emp.active)
                  .reduce((sum, emp) => {
                    const hours = getTotalHoursForEmployee(emp.id);
                    return sum + hours;
                  }, 0).toFixed(2)}
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
                  key={`task-select-${selectedCell.employeeId}-${selectedCell.date}`}
                  className="w-full p-2 border rounded mb-4"
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setIsCustomTask(true);
                    } else if (e.target.value.startsWith("skill-")) {
                      // Handle skill selection
                      const skillIndex = parseInt(e.target.value.split("-")[1], 10);
                      const selectedEmployee = employees.find(emp => emp.id === selectedCell.employeeId);
                      const selectedSkill = selectedEmployee?.skills[skillIndex];
                
                      if (selectedSkill) {
                        // Treat as if it were a custom task, only pre-filling the name of the custom task form
                        updateTaskInProgress("name", selectedSkill.name);
                        setIsCustomTask(true); // Switch to custom task form
                      }
                    } else if (e.target.value) {
                      handleAddTask(selectedCell.employeeId, selectedCell.date, e.target.value);
                    }
                  }}
                >
                  <option key="default" value="">Select a task</option>
                  <option key="custom" value="custom">CREATE NEW TASK</option>
                  {/* Add employees skills as an option */}
                  {employees.find(emp => emp.id === selectedCell.employeeId)?.skills.map((skill, index) => (
                    <option key={`skill-${index}`} value={`skill-${index}`}>
                      {skill.name} (Skill Rating: {skill.rating})
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
                    value={taskInProgress.name}
                    onChange={(e) => updateTaskInProgress("name", e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter task name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={taskInProgress.startTime}
                      onChange={(e) => updateTaskInProgress("startTime", e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={taskInProgress.stopTime}
                      onChange={(e) => updateTaskInProgress("stopTime", e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddTask(selectedCell.employeeId, selectedCell.date, taskInProgress.name, true)}
                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setIsCustomTask(false);
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