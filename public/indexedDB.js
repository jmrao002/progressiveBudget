const { request } = require("express");
const request = indexedDB.open("budget", 1);

// Create schema
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  // Create object store called budgetList
  db.createObjectStore("budgetList", { autoIncrement: true });
};

// Open transaction and access budgetList objectStore
request.onsuccess = (event) => {
  db = event.target.result;
  // check if app is online
  if (navigator.onLine) {
    checkDB();
  }
};

request.onerror = (event) => {
  console.log("Error: " + event.target.errorCode);
};

const saveRecord = (record) => {
  // create transaction on the pending db, give readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // access the pending objectStore
  const store = transaction.objectStore("pending");
  // add record to the store
  store.add(record);
};

const checkDB = () => {
  // open transaction in the budgetList
  const transaction = db.transaction(["pending"], "readwrite");
  // access the budgetList db object
  const store = transaction.objectStore("pending");
  // get everything from the objectStore, set to variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        header: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          return res.json();
        })
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
};

// check if back online
window.addEventListener("online", checkDB);
