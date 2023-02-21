let currentForm = "main";

const today = new Date().toISOString().slice(0, 16);

// ? Switch forms between create and check contracts
const switchForm = () => {
  if (currentForm === "main") {
    document.querySelector(".form--create").classList.add("form--visible");

    document
      .querySelector(`.form--${currentForm}`)
      .classList.remove("form--visible");

    currentForm = "create";

    document.getElementById("unblockTime").min = today;
  } else if (currentForm === "create") {
    document.querySelector(".form--main").classList.add("form--visible");

    document
      .querySelector(`.form--${currentForm}`)
      .classList.remove("form--visible");

    currentForm = "main";
  }
};

// ? Check contract button submit handler
const checkContract = () => {
  const contractAddress = document.getElementById("contractAddress").value;

  if (!contractAddress) {
    return;
  }

  document.getElementById("contractAddress").value = "";

  openContractPage(contractAddress);
};

// ? Redirect to contract page
// ? address = contract address
const openContractPage = (address) => {
  window.location = `contract.html?address=${address}`;
};

// ? Create contract
const createContract = () => {
  // ? Receiver address
  const receiverAddress = document.getElementById("receiverAddress").value;

  if (!receiverAddress) {
    return;
  }

  // ? Contract unblock time ( empty = no time ) ( unixtimestamp = with time )
  let unblockTime = document.getElementById("unblockTime").value;

  // ? Can change unblock time after contract created
  const canChangeTime = document.getElementById("canChangeTime").checked;

  if (unblockTime) {
    const unblockDate = new Date(unblockTime);
    unblockTime = unblockDate.getTime();
  }

  document.getElementById("receiverAddress").value = "";
  document.getElementById("unblockTime").value = "";
  document.getElementById("canChangeTime").checked = false;
};
