"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<{ lastName: string; firstName: string; email: string; minShift: number; maxShift: number; maxHours: string; }[]>([
    { lastName: "", firstName: "", email: "", minShift: 4, maxShift: 8, maxHours: "" },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const handleAddEmployee = () => {
    setEmployees([...employees, { lastName: "", firstName: "", email: "", minShift: 4, maxShift: 8.5, maxHours: "" }]);
  };

  const handleEmployeeChange = (index: number, field: string, value: string | string[]) => {
    const updatedEmployees = [...employees];
    updatedEmployees[index] = {
      ...updatedEmployees[index],
      [field]: value
    };
    setEmployees(updatedEmployees);
  };

  const handleDeleteEmployee = (index: number) => {
    if (employees.length <= 1) {
      alert("You need to have at least one employee");
      return;
    }
    
    const updatedEmployees = [...employees];
    updatedEmployees.splice(index, 1);
    setEmployees(updatedEmployees);
  };

  const handleSubmit = async () => {
    
    const user = auth.currentUser;
    for (const employee of employees) {
      if (!employee.firstName.trim()) {
        alert("Employee first name is required.");
        return;
      }
      if (!employee.lastName.trim()) {
        alert("Employee last name is required.");
        return;
      }
      if (!employee.minShift) {
          alert("Employee minimum shift is required.");
          return;
      }
      if (!employee.maxShift) {
          alert("Employee maximum shift is required.");
          return;
      }
      if (!employee.maxHours) {
          alert("Employee maximum hours is required.");
          return;
      }
      if (employee.minShift >= employee.maxShift) {
        alert("Minimum shift length must be smaller than max shift length.");
        return;
      }
      if (employee.minShift > Number(employee.maxHours)) {
          alert("Minimum shift length must be smaller than max hours.");
          return;
      }
      if (employee.maxShift > Number(employee.maxHours)) {
          alert("Maximum shift length must be smaller than max hours.");
          return;
      }
      if (Number(employee.maxHours) % 1 !== 0) {
        alert("Maximum weekly hours must be an integer.");
        return;
      }
    }

    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }
    const userId = user.uid;
    const schedulingRef = collection(db, "scheduling");
    const employeesRef = doc(schedulingRef, userId);

    try {
          await updateDoc(employeesRef, { employees });
          alert("Tasks saved successfully!");
        } catch (error) {
          // If the document doesn't exist, create it
          if ((error as { code?: string }).code === "not-found") {
            await setDoc(employeesRef, { employees });
            alert("Tasks saved successfully!");
          } else {
          console.error("Error saving tasks:", error);
          alert("Failed to save tasks. Please try again.");
        }
    }
  };

  const timeOptions = [2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12];
  
  useEffect(() => {
    const fetchEmployees = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to view employees.");
        return;
      }

      const userId = user.uid;
      const employeesRef = doc(db, "scheduling", userId);

      try {
        const docSnap = await getDoc(employeesRef);
        if (docSnap.exists()) {
          const fetchedEmployees = docSnap.data().employees || [];
          // Sort employees alphabetically by last name
          const sortedEmployees = fetchedEmployees.sort((a: { lastName: string; }, b: { lastName: string; }) =>
            a.lastName.localeCompare(b.lastName)
          );
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
    return <div className="flex items-center justify-center min-h-screen">Loading employees...</div>;
  }

  return (
    <div className="flex mx-auto justify-center min-h-screen bg-gray-100">
      <div className="mx-auto p-6 bg-white rounded shadow-md w-full max-w-7xl">
        <h1 className="text-2xl font-bold mb-4 text-black text-center">
          Manage Employees
        </h1>
        {employees.map((employee, index) => (
          <div
            key={index}
            className="mb-4 p-4 border rounded border-black text-black relative" // Added relative positioning
          >
            {/* Delete button - positioned at top right */}
            <button
              onClick={() => handleDeleteEmployee(index)}
              className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800"
              title="Delete employee"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex-1 max-w-[150px]">
                <span className="block text-sm font-medium text-gray-700">Last Name</span>
                <input
                  type="text"
                  value={employee.lastName}
                  onChange={(e) =>
                    handleEmployeeChange(index, "lastName", e.target.value)
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
                    handleEmployeeChange(index, "firstName", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>

              <label className="flex-1 max-w-[300px]">
                <span className="block text-sm font-medium text-gray-700">Email</span>
                <input
                  type="text"
                  value={employee.email}
                  onChange={(e) =>
                    handleEmployeeChange(index, "email", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>

              <label className="flex-1 max-w-[60px]">
                <span className="block text-sm font-medium text-gray-700">Min Shift</span>
                <select
                  value={employee.minShift}
                  onChange={(e) =>
                    handleEmployeeChange(index, "minShift", e.target.value)
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
                    handleEmployeeChange(index, "maxShift", e.target.value)
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
                    handleEmployeeChange(index, "maxHours", e.target.value)
                  }
                  className="w-full p-2 border rounded border-black text-black text-sm"
                />
              </label>
            </div>
          </div>
        ))}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleAddEmployee}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Employee
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Employees
          </button>
        </div>
      </div>
    </div>
  );
}