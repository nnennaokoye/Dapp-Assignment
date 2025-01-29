import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css"; 

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

      const rawTasks = await contract.getMyTask();

      // Map the tasks correctly to structure them properly
      const formattedTasks = rawTasks.map((task) => ({
        id: task.id.toString(), // Convert to string to prevent key issues
        taskTitle: task.taskTitle,
        taskText: task.taskText,
        isDeleted: task.isDeleted,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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
    <div className="container">
      <h1>Sunshine Task Manager</h1>

      {!isActiveWallet ? (
        <button onClick={connectWallet} className="btn">
          Connect Wallet
        </button>
      ) : (
        <p className="wallet-info">
          Connected: {wallet.substring(0, 6)}...{wallet.slice(-4)}
        </p>
      )}

      <div className="task-form">
        <h2>Add a New Task</h2>
        <input
          type="text"
          placeholder="Task Title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Task Description"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
        />
        <button onClick={addTask} className="btn success">
          Add Task
        </button>
      </div>

      <h2>My Tasks</h2>
      <div className="task-list">
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div key={index} className="task">
              <div>
                <h3>{task.taskTitle}</h3>
                <p>{task.taskText}</p>
              </div>
              <button onClick={() => deleteTask(task.id)} className="delete-btn">
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="no-tasks">No tasks found.</p>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
