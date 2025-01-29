import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const contractAddress = "0xFEd0396c3252b29477483D0EAa94e963ead54083";

function App() {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [wallet, setWallet] = useState("");
  const [isActiveWallet, setIsActiveWallet] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setIsActiveWallet(true);
          fetchTasks();
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWallet(accounts[0]);
        setIsActiveWallet(true);
        toast.success("Wallet connected!");
        fetchTasks();
      } catch (error) {
        toast.error("Failed to connect wallet!");
      }
    } else {
      toast.error("Please install MetaMask.");
    }
  };

  const addTask = async () => {
    if (!taskTitle || !taskText) {
      toast.error("Please enter task title and description.");
      return;
    }
    if (!isActiveWallet) {
      toast.error("Connect wallet first.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract.addTask(taskText, taskTitle, false);
      await tx.wait();

      toast.success("Task added!");
      setTaskTitle("");
      setTaskText("");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to add task.");
    }
  };

  const fetchTasks = async () => {
    if (!isActiveWallet) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const tasks = await contract.getMyTask();
      setTasks(tasks);
    } catch (error) {
      toast.error("Failed to fetch tasks.");
    }
  };

  const deleteTask = async (taskId) => {
    if (!isActiveWallet) {
      toast.error("Connect wallet first.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract.deleteTask(taskId);
      await tx.wait();

      toast.success("Task deleted!");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to delete task.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-500">Sunshine Task Manager</h1>

      {!isActiveWallet ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg shadow-md transition-all"
        >
          Connect Wallet
        </button>
      ) : (
        <p className="text-sm text-gray-300">Connected: {wallet.substring(0, 6)}...{wallet.slice(-4)}</p>
      )}

      <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
        <h2 className="text-xl font-semibold mb-4">Add a New Task</h2>
        <input
          type="text"
          placeholder="Task Title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="w-full p-3 rounded-md bg-gray-700 text-white mb-3 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Task Description"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="w-full p-3 rounded-md bg-gray-700 text-white mb-3 focus:outline-none"
        />
        <button
          onClick={addTask}
          className="w-full bg-green-600 hover:bg-green-500 py-2 rounded-md text-white font-semibold transition-all"
        >
          Add Task
        </button>
      </div>

      <h2 className="text-2xl font-semibold mt-8">My Tasks</h2>
      <div className="w-full max-w-lg mt-4">
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-lg mb-3 flex justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-400">{task.taskTitle}</h3>
                <p className="text-gray-300">{task.taskText}</p>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-white font-semibold transition-all"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No tasks found.</p>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;