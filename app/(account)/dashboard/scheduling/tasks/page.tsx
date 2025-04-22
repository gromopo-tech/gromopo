"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useTimeFormat } from "@/app/hooks/useTimeFormat";

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    { id: crypto.randomUUID(), name: "", days: [] as string[], startTime: "", stopTime: "" },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatTime } = useTimeFormat();

  const handleAddTask = () => {
    setTasks([...tasks, { id: crypto.randomUUID(), name: "", days: [], startTime: "", stopTime: "" }]);
  };

  const handleTaskChange = (index: number, field: string, value: string | string[]) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value
    };
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (index: number) => {
    if (tasks.length <= 1) {
      alert("You need to have at least one task");
      return;
    }
    
    const updatedTasks = [...tasks];
    updatedTasks.splice(index, 1);
    setTasks(updatedTasks);
  };

  const handleDayChange = (index: number, day: string, isChecked: boolean) => {
    const updatedTasks = [...tasks];
    if (isChecked) {
      // Add the day if checked
      updatedTasks[index].days = [...updatedTasks[index].days, day];
    } else {
      // Remove the day if unchecked
      updatedTasks[index].days = updatedTasks[index].days.filter(d => d !== day);
    }
    setTasks(updatedTasks);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    for (const task of tasks) {
      if (!task.name.trim()) {
        alert("Task name is required.");
        return;
      }
      if (task.days.length === 0) {
        alert("At least one day must be selected.");
        return;
      }
      if (!task.startTime) {
        alert("Start time is required.");
        return;
      }
      if (!task.stopTime) {
        alert("Stop time is required.");
        return;
      }
      if (task.startTime >= task.stopTime) {
        alert("Start time must be before stop time.");
        return;
      }
    }

    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }
    const userId = user.uid;
    const schedulingRef = collection(db, "scheduling");
    const tasksRef = doc(schedulingRef, userId);

    try {
      // First, get the current employees data to update their skills
      const currentDoc = await getDoc(tasksRef);
      const currentData = currentDoc.exists() ? currentDoc.data() : {};
      const currentEmployees = currentData.employees || [];
      const currentTasks = currentData.tasks || [];

      // Create a map of old task names to new task names
      const taskNameMap = new Map();
      currentTasks.forEach((oldTask: any) => {
        const newTask = tasks.find(t => t.id === oldTask.id);
        if (newTask && oldTask.name !== newTask.name) {
          taskNameMap.set(oldTask.name, newTask.name);
        }
      });

      // Update employee skills with new task names
      const updatedEmployees = currentEmployees.map((emp: any) => ({
        ...emp,
        skills: emp.skills.map((skill: any) => ({
          ...skill,
          task: taskNameMap.get(skill.task) || skill.task
        }))
      }));

      // Save both updated tasks and employees
      await updateDoc(tasksRef, { 
        tasks,
        employees: updatedEmployees
      });
      alert("Tasks saved successfully!");
    } catch (error) {
      // If the document doesn't exist, create it
      if ((error as { code?: string }).code === "not-found") {
        await setDoc(tasksRef, { tasks });
        alert("Tasks saved successfully!");
      } else {
        console.error("Error saving tasks:", error);
        alert("Failed to save tasks. Please try again.");
      }
    }
  };

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  });

  const daysOfWeek = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  useEffect(() => {
    const fetchTasks = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to view tasks.");
        return;
      }

      const userId = user.uid;
      const tasksRef = doc(db, "scheduling", userId);

      try {
        const docSnap = await getDoc(tasksRef);
        if (docSnap.exists()) {
          const fetchedTasks = docSnap.data().tasks || [];
          // Ensure each task has a stable ID
          const tasksWithIds = fetchedTasks.map((task: any) => ({
            ...task,
            id: task.id || crypto.randomUUID() // Only generate new ID if one doesn't exist
          }));
          // Sort tasks alphabetically by name
          const sortedTasks = tasksWithIds.sort((a: { name: string; }, b: { name: string; }) =>
            a.name.localeCompare(b.name)
          );
          setTasks(sortedTasks);
        } else {
          console.log("No tasks found for this user.");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        alert("Failed to fetch tasks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-black">Loading tasks...</div>;
  }

  return (
    <div className="flex mx-auto justify-center min-h-screen bg-gray-100">
      <div className="mx-auto p-6 bg-white rounded shadow-md w-full max-w-7xl">
        <h1 className="text-2xl font-bold mb-4 text-black text-center">
          Manage Tasks
        </h1>{/*
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div
              key={index}
              className="mb-4 p-4 border rounded border-black text-black"
            >
              <p><strong>Task Name:</strong> {task.name}</p>
              <p><strong>Days:</strong> {task.days.join(", ")}</p>
              <p><strong>Start Time:</strong> {task.startTime}</p>
              <p><strong>Stop Time:</strong> {task.stopTime}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No tasks found. Add a new task to get started!</p>
        )} */}
        {tasks.map((task, index) => (
          <div
            key={index}
            className="mb-4 p-4 border rounded border-black text-black relative" // Added relative positioning
          >
            {/* Delete button - positioned at top right */}
            <button
              onClick={() => handleDeleteTask(index)}
              className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800"
              title="Delete task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Name</label>
                <input
                  type="text"
                  value={task.name}
                  onChange={(e) => handleTaskChange(index, "name", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <select
                    value={task.startTime}
                    onChange={(e) => handleTaskChange(index, "startTime", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select start time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <select
                    value={task.stopTime}
                    onChange={(e) => handleTaskChange(index, "stopTime", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select end time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Task
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Tasks
          </button>
        </div>
      </div>
    </div>
  );
}