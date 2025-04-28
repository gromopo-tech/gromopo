"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { formatTimeDisplay } from "@/lib/timeUtils";
import React from "react";

// Define types for better type safety
type Availability = {
  [day: string]: {
    [hour: string]: 'L' | 'D' | '';
  };
};

type Employee = {
  active: boolean;
  lastName: string;
  firstName: string;
  id: string;
  email: string;
  minShift: number;
  maxShift: number;
  maxHours: string;
  skills: { name: string; rating: string }[];
  availability: Availability;
};

const timeOptions = [2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12];
const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function EmployeesPage() {
  const user = auth.currentUser!;
  const userRef = doc(db, "users", user.uid);
  const [startDay, setStartDay] = useState<string>("sun"); // Default to Sunday
  const startDayIndex = daysOfWeek.indexOf(startDay);
  const orderedDays = [...daysOfWeek.slice(startDayIndex), ...daysOfWeek.slice(0, startDayIndex)];

  const defaultAvailability: Availability = orderedDays.reduce((acc, day) => {
    acc[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      acc[day][`${hour.toString().padStart(2, '0')}:00`] = '';
    }
    return acc;
  }, {} as Availability);

  // Initialize hours for each day
  for (const day in defaultAvailability) {
    for (let hour = 0; hour < 24; hour++) {
      defaultAvailability[day][`${hour.toString().padStart(2, '0')}:00`] = '';
    }
  }

  const [employees, setEmployees] = useState<Employee[]>([
    { 
      active: true,
      lastName: "", 
      firstName: "", 
      id: "",
      email: "", 
      minShift: 4, 
      maxShift: 8, 
      maxHours: "", 
      skills: [],
      availability: JSON.parse(JSON.stringify(defaultAvailability)) // Deep copy
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>(() => {
    // Initialize all sections as collapsed by default
    const initialCollapsed: {[key: string]: boolean} = {};
    employees.forEach((_, index) => {
      initialCollapsed[`${index}-skills`] = true;
      initialCollapsed[`${index}-availability`] = true;
    });
    return initialCollapsed;
  });

  const toggleSection = (employeeIndex: number, section: 'skills' | 'availability') => {
    setCollapsedSections(prev => ({
      ...prev,
      [`${employeeIndex}-${section}`]: !prev[`${employeeIndex}-${section}`]
    }));
  };

  const isSectionCollapsed = (employeeIndex: number, section: 'skills' | 'availability') => {
    return collapsedSections[`${employeeIndex}-${section}`] ?? true; // Default to true if not set
  };

  const handleAddEmployee = () => {
    setEmployees([...employees, 
      { 
        active: true,
        lastName: "", 
        firstName: "", 
        id: "",
        email: "", 
        minShift: 4, 
        maxShift: 8.5, 
        maxHours: "", 
        skills: [],
        availability: JSON.parse(JSON.stringify(defaultAvailability)) // Deep copy
      }
    ]);
  };

  const handleEmployeeChange = (employeeIndex: number, field: string, value: string | string[] | number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex] = {
      ...updatedEmployees[employeeIndex],
      [field]: value
    };
    setEmployees(updatedEmployees);
  };

  const handleToggleActive = (employeeIndex: number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex].active = !updatedEmployees[employeeIndex].active;
    setEmployees(updatedEmployees);
  };

  const [dragging, setDragging] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'L' | 'D' | ''>('L');

  const handleSlotMouseDown = (employeeIndex: number, day: string, time: string) => {
    setDragging(true);
    handleAvailabilityChange(employeeIndex, day, time, selectionMode);
  };

  const handleSlotMouseEnter = (employeeIndex: number, day: string, time: string) => {
    if (dragging) {
      handleAvailabilityChange(employeeIndex, day, time, selectionMode);
    }
  };

  const handleSlotMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    // Add event listener to handle mouse up globally
    document.addEventListener("mouseup", handleSlotMouseUp);

    return () => {
      // Cleanup event listener on component unmount
      document.removeEventListener("mouseup", handleSlotMouseUp);
    };
  }, []);

  // Handle availability changes
  const handleAvailabilityChange = (
    employeeIndex: number,
    day: string,
    time: string,
    value: 'L' | 'D' | ''
  ) => {
    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex].availability[day][time] = value;
    setEmployees(updatedEmployees);
  };

  // Add a skill to an employee
  const handleAddSkill = (employeeIndex: number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex].skills.push({ name: "", rating: "" }); // Ensure default values
    setEmployees(updatedEmployees);
  };

  const [tasks, setTasks] = useState<string[]>([]); // Store tasks from Firestore

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedTasks = data.tasks || [];
          setTasks(fetchedTasks.sort((a: string, b: string) => a.localeCompare(b))); // Sort tasks alphabetically
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  const handleAddNewTask = async (newTask: string) => {
    const upperCaseTask = newTask.toUpperCase(); // Convert to uppercase

    if (tasks.includes(upperCaseTask)) {
      alert("This task already exists. Please enter a unique task name.");
      return;
    }

    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        // If the document doesn't exist, create it
        await setDoc(userRef, { tasks: [upperCaseTask] });
      } else {
        // If the document exists, update it
        const updatedTasks = [...tasks, upperCaseTask].sort((a, b) => a.localeCompare(b));
        setTasks(updatedTasks);
        await updateDoc(userRef, { tasks: updatedTasks });
      }
    } catch (error) {
      console.error("Error adding new task:", error);
      alert("Failed to add new task. Please try again.");
    }
  };

  // Update a skill for an employee
  const handleSkillChange = (
    employeeIndex: number,
    skillIndex: number,
    field: string,
    value: string | number
  ) => {
    const updatedEmployees = [...employees];

    if (field === "name" && value === "CREATE NEW TASK") {
      const newTaskName = prompt("Enter the name of the new task:");
      if (newTaskName) {
        const upperCaseTask = newTaskName.toUpperCase();

        if (!tasks.includes(upperCaseTask)) {
          const updatedTasks = [...tasks, upperCaseTask].sort((a, b) => a.localeCompare(b));
          setTasks(updatedTasks);
          handleAddNewTask(upperCaseTask);
        }

        updatedEmployees[employeeIndex].skills[skillIndex] = {
          ...updatedEmployees[employeeIndex].skills[skillIndex],
          [field]: upperCaseTask,
        };
      }
    } else {
      updatedEmployees[employeeIndex].skills[skillIndex] = {
        ...updatedEmployees[employeeIndex].skills[skillIndex],
        [field]: value,
      };
    }

    setEmployees(updatedEmployees);
  };

  useEffect(() => {
    // Ensure dropdown menu updates dynamically when tasks state changes
    const dropdowns = document.querySelectorAll("select");
    dropdowns.forEach((dropdown) => {
      dropdown.dispatchEvent(new Event("change"));
    });
  }, [tasks]);

  const handleDeleteSkill = (employeeIndex: number, skillIndex: number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[employeeIndex].skills.splice(skillIndex, 1);
    setEmployees(updatedEmployees);
  };

  const handleDeleteEmployee = (employeeIndex: number) => {
    if (employees.length <= 1) {
      alert("You need to have at least one employee");
      return;
    }
    
    const updatedEmployees = [...employees];
    updatedEmployees.splice(employeeIndex, 1);
    setEmployees(updatedEmployees);
  };

  const saveEmployeeToFirestore = async (employee: Employee) => {
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        // If the document doesn't exist, create it
        await setDoc(userRef, { employees: [employee] });
      } else {
        // If the document exists, update it
        const currentData = docSnap.data();
        const updatedEmployees = currentData.employees || [];
        const existingIndex = updatedEmployees.findIndex((e: Employee) => e.id === employee.id);

        if (existingIndex !== -1) {
          updatedEmployees[existingIndex] = employee;
        } else {
          updatedEmployees.push(employee);
        }

        await updateDoc(userRef, { employees: updatedEmployees });
      }
    } catch (error) {
      console.error("Error saving employee to Firestore:", error);
    }
  };

  const handleSaveEmployee = async (employeeIndex: number) => {
    const employee = employees[employeeIndex];

    // Sort skills alphabetically before saving
    employee.skills.sort((a, b) => a.name.localeCompare(b.name));

    // Validate employee fields
    if (!employee.firstName.trim()) {
      alert("Employee first name is required.");
      return;
    }
    if (!employee.lastName.trim()) {
      alert("Employee last name is required.");
      return;
    }
    if (!employee.id.trim()) {
      alert("Employee ID is required.");
      return;
    }
    // check if employee ID already exists
    const existingEmployee = employees.find(
      (emp, index) =>
        emp.id === employee.id &&
        index !== employeeIndex
    );
    if (existingEmployee) {
      alert(`Employee ID already exists: ${employee.id}`);
      return;
    }
    if (!employee.minShift) {
      alert(`Employee minimum shift is required for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    if (!employee.maxShift) {
      alert(`Employee maximum shift is required for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    if (!employee.maxHours) {
      alert(`Employee maximum hours is required for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    if (employee.minShift >= employee.maxShift) {
      alert(`Minimum shift length must be smaller than max shift length for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    if (employee.minShift > Number(employee.maxHours)) {
      alert(`Minimum shift length must be smaller than max hours for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    if (employee.maxShift > Number(employee.maxHours)) {
      alert(`Maximum shift length must be smaller than max hours for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    if (Number(employee.maxHours) % 1 !== 0) {
      alert(`Maximum weekly hours must be an integer for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    
    // Validate employee availability
    const isAvailable = Object.values(employee.availability).some((day) =>
      Object.values(day).some((hour) => hour === "L" || hour === "D")
    );
    if (!isAvailable) {
      alert(`Employee must be available at least one hour for any day for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }

    // Validate employee skills
    if (employee.skills.length === 0) {
      alert(`At least one skill is required for ${employee.lastName}, ${employee.firstName}.`);
      return;
    }
    for (const skill of employee.skills) {
      if (!skill.name.trim()) {
        alert(`Skill name cannot be empty for ${employee.lastName}, ${employee.firstName}.`);
        return;
      }
      if (!skill.rating || skill.rating === "") {
        alert(`Skill rating is required for ${employee.lastName}, ${employee.firstName} for skill ${skill.name}.`);
        return;
      }
    }

    try {
      await saveEmployeeToFirestore(employee);
      alert(`Employee ${employee.lastName}, ${employee.firstName} saved successfully!`);
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Failed to save employee. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const updatedEmployees = employees.map((employee) => {
      // Sort skills alphabetically before saving all employees
      return {
        ...employee,
        skills: [...employee.skills].sort((a, b) => a.name.localeCompare(b.name)),
      };
    });

    for (let employeeIndex = 0; employeeIndex < updatedEmployees.length; employeeIndex++) {
      const employee = updatedEmployees[employeeIndex];

      {/* Validate employee fields */}

      // At least one employee must be active
      const activeEmployees = updatedEmployees.filter(emp => emp.active);
      if (activeEmployees.length === 0) {
        alert("At least one employee must be active.");
        return;
      }
      if (!employee.firstName.trim()) {
        alert("Employee first name is required.");
        return;
      }
      if (!employee.lastName.trim()) {
        alert("Employee last name is required.");
        return;
      }
      // check if employee already exists
      const existingEmployee = updatedEmployees.find(
        (emp, index) =>
          emp.firstName === employee.firstName &&
          emp.lastName === employee.lastName &&
          index !== employeeIndex // Exclude the current employee from the check
      );
      if (existingEmployee) {
        alert(`Employee already exists for ${employee.lastName}, ${employee.firstName}.`);
        return;
      }
      if (!employee.minShift) {
          alert(`Employee minimum shift is required for ${employee.lastName}, ${employee.firstName}.`);
          return;
      }
      if (!employee.maxShift) {
          alert(`Employee maximum shift is required for ${employee.lastName}, ${employee.firstName}.`);
          return;
      }
      if (!employee.maxHours) {
          alert(`Employee maximum hours is required for ${employee.lastName}, ${employee.firstName}.`);
          return;
      }
      if (employee.minShift >= employee.maxShift) {
        alert(`Minimum shift length must be smaller than max shift length for ${employee.lastName}, ${employee.firstName}.`);
        return;
      }
      if (employee.minShift > Number(employee.maxHours)) {
          alert(`Minimum shift length must be smaller than max hours for ${employee.lastName}, ${employee.firstName}.`);
          return;
      }
      if (employee.maxShift > Number(employee.maxHours)) {
          alert(`Maximum shift length must be smaller than max hours for ${employee.lastName}, ${employee.firstName}.`);
          return;
      }
      if (Number(employee.maxHours) % 1 !== 0) {
        alert(`Maximum weekly hours must be an integer for ${employee.lastName}, ${employee.firstName}.`);
        return;
      }
      
      {/* Validate employee availability */}
      // Check that employee is availabile at least one hour for any day
      const isAvailable = Object.values(employee.availability).some((day) =>
        Object.values(day).some((hour) => hour === "L" || hour === "D")
      );
      if (!isAvailable) {
        alert(`Employee must be available at least one hour for any day for ${employee.lastName}, ${employee.firstName}.`);
        return;
      }

      {/* Validate employee skills */}
      if (employee.skills.length === 0) {
        alert(`At least one skill is required for ${employee.lastName}, ${employee.firstName}.`);
        return;
      }
      // Validate skill cannot be empty
      for (const skill of employee.skills) {
        if (!skill.name.trim()) {
          alert(`Skill name cannot be empty for ${employee.lastName}, ${employee.firstName}.`);
          return;
        }
        if (skill.rating === "" || skill.rating === null || skill.rating === undefined) {
          alert(`Skill rating is required for ${employee.lastName}, ${employee.firstName} for skill ${skill.name}.`);
          return;
        }
        if (employee.skills.length > 1) {
          const skillExists = employee.skills.some(
            (s, index) => s.name === skill.name && index !== employee.skills.indexOf(skill)
          );
          if (skillExists) {
            alert(`Skill name must be unique for ${employee.lastName}, ${employee.firstName}.`);
            return;
          }
        }
      }
    };

    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }

    try {
          await updateDoc(userRef, { employees: updatedEmployees });
          alert("Employees saved successfully!");
        } catch (error) {
          // If the document doesn't exist, create it
          if ((error as { code?: string }).code === "not-found") {
            await setDoc(userRef, { employees: updatedEmployees });
            alert("Employees saved successfully!");
          } else {
          console.error("Error saving employees:", error);
          alert("Failed to save employees. Please try again.");
        }
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

  // Fetch employees from Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const fetchedEmployees = docSnap.data().employees || [];
          // Ensure each employee has availability and id
          const employeesWithAvailability = fetchedEmployees.map((emp: any) => ({
            ...emp,
            id: emp.id || "", // Ensure id is always defined
            availability: emp.availability || JSON.parse(JSON.stringify(defaultAvailability))
          }));
          // Sort employees alphabetically by last name then first name
          const sortedEmployees = employeesWithAvailability.sort((a: Employee, b: Employee) => {
            const lastNameComparison = a.lastName.localeCompare(b.lastName);
            if (lastNameComparison !== 0) return lastNameComparison;
            return a.firstName.localeCompare(b.firstName);
          });
          setEmployees(sortedEmployees);
        } else {
          console.log("No employees found for this user.");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        alert("Failed to fetch employees. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-black">Loading employees...</div>;
  }

  return (
    <div className="flex mx-auto justify-center min-h-screen bg-gray-100">
      <div className="mx-auto p-6 bg-white rounded shadow-md w-full max-w-7xl">
        <h1 className="text-2xl font-bold mb-4 text-black text-center">
          Manage Employees
        </h1>
        {employees.map((employee, employeeIndex) => (
          <div
            key={employeeIndex}
            className={`mb-4 p-4 border rounded border-black text-black relative 
              ${!employee.active ? 'bg-gray-400 opacity-80 border-gray-600' : 'bg-white border-black'}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleToggleActive(employeeIndex)}
                  className={`px-3 py-1 rounded transition-colors duration-200 ${
                    employee.active ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {employee.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDeleteEmployee(employeeIndex)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleSaveEmployee(employeeIndex)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex-1 max-w-[150px]">
                <span className="block text-sm font-medium text-gray-700">Last Name</span>
                <input
                  type="text"
                  value={employee.lastName}
                  onChange={(e) =>
                    handleEmployeeChange(employeeIndex, "lastName", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>
              
              <label className="flex-1 max-w-[150px]">
                <span className="block text-sm font-medium text-gray-700">First Name</span>
                <input
                  type="text"
                  value={employee.firstName}
                  onChange={(e) =>
                    handleEmployeeChange(employeeIndex, "firstName", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>

              <label className="flex-1 max-w-[50px]">
                <span className="block text-sm font-medium text-gray-700">ID</span>
                <input
                  type="text"
                  value={employee.id}
                  onChange={(e) => handleEmployeeChange(employeeIndex, "id", e.target.value)}
                  className="w-full p-2 border rounded border-black text-black text-sm"
                  placeholder="ID"
                />
              </label>

              <label className="flex-1 max-w-[300px]">
                <span className="block text-sm font-medium text-gray-700">Email</span>
                <input
                  type="text"
                  value={employee.email}
                  onChange={(e) =>
                    handleEmployeeChange(employeeIndex, "email", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>

              <label className="flex-1 max-w-[60px]">
                <span className="block text-sm font-medium text-gray-700">Min Shift</span>
                <select
                  value={employee.minShift}
                  onChange={(e) =>
                    handleEmployeeChange(employeeIndex, "minShift", parseFloat(e.target.value))
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                >
                  <option value="">Select hours</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex-1 max-w-[65px]">
                <span className="block text-sm font-medium text-gray-700">Max Shift</span>
                <select
                  value={employee.maxShift}
                  onChange={(e) =>
                    handleEmployeeChange(employeeIndex, "maxShift", parseFloat(e.target.value))
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                >
                  <option value="">Select hours</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex-1 max-w-[75px]">
                <span className="block text-sm font-medium text-gray-700">Max Hours</span>
                <input
                  type="text"
                  value={employee.maxHours}
                  onChange={(e) =>
                    handleEmployeeChange(employeeIndex, "maxHours", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>

            </div>

            {/* Skills Section */}
            <div className="mt-4">
              <div
                className="flex items-center cursor-pointer group"
                onClick={() => toggleSection(employeeIndex, 'skills')}
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform mr-2 group-hover:text-blue-600 ${isSectionCollapsed(employeeIndex, 'skills') ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-200">Skills</h3>
              </div>
              {!isSectionCollapsed(employeeIndex, 'skills') && (
                <>
                  {employee.skills.map((skill, skillIndex) => (
                    <div key={skillIndex} className="flex items-center gap-4 mt-2 col-span-2">
                      <button
                        onClick={() => handleDeleteSkill(employeeIndex, skillIndex)}
                        className="auto-mx p-1 text-red-500 hover:text-red-700"
                        title="Delete skill"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <label className="flex-1 max-w-[300px]">
                        <span className="block text-sm font-medium text-gray-700">Name</span>
                        <select
                          value={skill.name || ""}
                          onChange={(e) =>
                            handleSkillChange(employeeIndex, skillIndex, "name", e.target.value)
                          }
                          className="w-full p-2 border rounded border-black text-black"
                        >
                          <option key="default" value="">Select a task</option>
                          <option value="CREATE NEW TASK" style={{ fontStyle: "italic" }}>CREATE NEW TASK</option>
                          {tasks.map((task, index) => (
                            <option key={index} value={task}>
                              {task}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex-1 max-w-[100px]">
                        <span className="block text-sm font-medium text-gray-700">Rating</span>
                        <select
                          value={skill.rating || ""}
                          onChange={(e) =>
                            handleSkillChange(
                              employeeIndex,
                              skillIndex,
                              "rating",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full p-2 border rounded border-black text-black"
                        >
                          <option value="">Select</option>
                          {[1, 2, 3, 4].map((rating) => (
                            <option key={rating} value={rating.toString()}>
                              {rating}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddSkill(employeeIndex)}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    New Skill
                  </button>
                </>
              )}
            </div>

            {/* Draggable Availability Grid */}
            <div className="mt-4">
              <div 
                className="flex items-center cursor-pointer group"
                onClick={() => toggleSection(employeeIndex, 'availability')}
              >
                <svg 
                  className={`w-5 h-5 transform transition-transform mr-2 group-hover:text-blue-600 ${isSectionCollapsed(employeeIndex, 'availability') ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-200">Weekly Availability</h3>
              </div>
              {!isSectionCollapsed(employeeIndex, 'availability') && (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-gray-100 p-1 text-center font-medium text-sm sticky left-0 border border-gray-300">Time</th>
                          {orderedDays.map((day) => (
                            <th key={day} className="bg-gray-100 p-1 text-center font-medium text-sm border border-gray-300 capitalize">
                              {day.slice(0, 3)} {/* Display the first three letters of the day */}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 24 }).map((_, hour) => {
                          const time = `${hour.toString().padStart(2, '0')}:00`;
                          const displayTime = formatTimeDisplay(time);
                          return (
                            <tr key={time}>
                              <td className="bg-gray-50 p-1 text-xs text-center border border-gray-300 sticky left-0">
                                {displayTime}
                              </td>
                              {orderedDays.map((day) => {
                                const currentValue = employees[employeeIndex].availability[day][time] || '';
                                return (
                                  <td 
                                    key={`${day}-${time}`}
                                    className={`p-0 border border-gray-200 relative ${currentValue === 'L' ? 'bg-green-100' : currentValue === 'D' ? 'bg-yellow-100' : ''}`}
                                  >
                                    <button
                                      className={`w-full h-8 focus:outline-none ${currentValue === 'L' ? 'bg-green-400' : currentValue === 'D' ? 'bg-yellow-400' : ''}`}
                                      onMouseDown={() => handleSlotMouseDown(employeeIndex, day, time)}
                                      onMouseEnter={() => handleSlotMouseEnter(employeeIndex, day, time)}
                                      onMouseUp={() => setDragging(false)}
                                      title={`${day} at ${displayTime}`}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex gap-4">
                    <div className="flex items-center">
                      <span className="block w-4 h-4 bg-green-400 mr-2"></span>
                      <span>Preferred</span>
                    </div>
                    <div className="flex items-center">
                      <span className="block w-4 h-4 bg-yellow-400 mr-2"></span>
                      <span>If Needed</span>
                    </div>
                    <button 
                      onClick={() => setSelectionMode('L')}
                      className={`px-3 py-1 rounded ${selectionMode === 'L' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      Set Preferred
                    </button>
                    <button 
                      onClick={() => setSelectionMode('D')}
                      className={`px-3 py-1 rounded ${selectionMode === 'D' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
                    >
                      Set If Needed
                    </button>
                    <button 
                      onClick={() => setSelectionMode('')}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        ))}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleAddEmployee}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
          >
            New Employee
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
}