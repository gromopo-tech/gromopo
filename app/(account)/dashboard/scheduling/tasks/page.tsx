"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    { name: "", days: [] as string[], startTime: "", stopTime: "" }, // Changed 'day' to 'days' as array
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const handleAddTask = () => {
    setTasks([...tasks, { name: "", days: [], startTime: "", stopTime: "" }]);
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

    const userId = user.uid;
    const schedulingRef = collection(db, "scheduling");
    const tasksRef = doc(schedulingRef, userId);

    try {
      await setDoc(tasksRef, { tasks });
      alert("Tasks saved successfully!");
    } catch (error) {
      console.error("Error saving tasks:", error);
      alert("Failed to save tasks. Please try again.");
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
          // Sort tasks alphabetically by name
          const sortedTasks = fetchedTasks.sort((a, b) =>
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
    return <div className="flex items-center justify-center min-h-screen">Loading tasks...</div>;
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

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex-1 min-w-[200px]">
                <span className="block text-sm font-medium text-gray-700">Task Name</span>
                <input
                  type="text"
                  value={task.name}
                  onChange={(e) =>
                    handleTaskChange(index, "name", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>
              
              <label className="flex-1 min-w-[300px]">
                <span className="block text-sm font-medium text-gray-700 mb-1">Days</span>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={task.days.includes(day)}
                        onChange={(e) => 
                          handleDayChange(index, day, e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {day.substring(0, 3)}
                      </span>
                    </label>
                  ))}
                </div>
              </label>

              <label className="flex-1 min-w-[120px]">
                <span className="block text-sm font-medium text-gray-700">Start Time</span>
                <select
                  value={task.startTime}
                  onChange={(e) =>
                    handleTaskChange(index, "startTime", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                >
                  <option value="">Select time</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 min-w-[120px]">
                <span className="block text-sm font-medium text-gray-700">End Time</span>
                <select
                  value={task.stopTime}
                  onChange={(e) =>
                    handleTaskChange(index, "stopTime", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                >
                  <option value="">Select time</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
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