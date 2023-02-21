const querySearch = new URLSearchParams(window.location.search);
const contractAddress = querySearch.get("address");
const today = new Date().toISOString().slice(0, 16);

let subdomain =
  window.localStorage.getItem("testnet") === "true" ? "testnet." : "";
let currentTonWallets = [];
let buttonType = "withdraw";
let selectedToken = null;

const contractData = {
  balances: {},
};

const userData = {
  balances: {},
};

const convertBalance = (number = 0, decimals = 9) => {
  return number / 10 ** Number(decimals);
};

const numberToLocalString = (number = 0) => {
  return number.toLocaleString("en-En");
};

const updateList = () => {
  const selectList = document.getElementById("tokenSelect");
  const walletBalanceEl = document.getElementById("walletBalance");

  selectList.innerHTML = "";

  const object = buttonType === "pay" ? userData : contractData;

  const isTonExist = object.balances.TON || null;

  if (selectedToken && !object.balances[selectedToken]) {
    selectedToken = null;
  }

  if (!selectedToken && isTonExist) {
    selectedToken = "TON";
  }

  Object.values(object.balances).forEach((token, index) => {
    const { metadata } = token;
    const { symbol } = metadata;

    if (!selectedToken && !isTonExist && index === 0) {
      selectedToken = symbol;
    }

    selectList.innerHTML += `<option value="${symbol}">${symbol}</option>`;
  });

  const selectedTokenBalance = object.balances[selectedToken]?.balance || 0;

  if (!isNaN(selectedTokenBalance)) {
    walletBalanceEl.innerText = `Balance: ${numberToLocalString(
      selectedTokenBalance
    )} ${selectedToken}`;
  }

  selectList.value = selectedToken;
};

const loadWallets = async () => {
  const result = await window.ton.send("ton_requestAccounts");

  currentTonWallets = result || [];
};

const getContractTonBalance = async (
  searchAddress = contractAddress,
  object = contractData
) => {
  const result = await fetch(
    `https://${subdomain}tonapi.io/v1/account/getInfo?account=${searchAddress}`,
    {
      headers: {
        ["Content-Type"]: "application/json",
      },
    }
  ).then((res) => res.json());

  const { balance, address, icon } = result;
  const { bounceable } = address;

  object.balances.TON = {
    balance: convertBalance(balance),
    walletAddress: bounceable,
    metadata: {
      symbol: "TON",
      image: icon,
    },
  };
};

const getContractJettonsBalance = async (
  searchAddress = contractAddress,
  object = contractData
) => {
  const result = await fetch(
    `https://${subdomain}tonapi.io/v1/jetton/getBalances?account=${searchAddress}`,
    {
      headers: {
        ["Content-Type"]: "application/json",
      },
    }
  ).then((res) => res.json());

  result.balances.forEach((value) => {
    const { balance, metadata, wallet_address } = value;
    const { symbol, decimals, image } = metadata;
    const { address } = wallet_address;

    object.balances[symbol] = {
      balance: convertBalance(balance, decimals),
      walletAddress: address,
      metadata: {
        symbol,
        image,
      },
    };
  });
};

const getContractInfo = async () => {
  const result = await fetch(
    `https://${subdomain}toncenter.com/api/v2/runGetMethod`,
    {
      headers: {
        ["Content-Type"]: "application/json",
      },
      body: JSON.stringify({
        address: contractAddress,
        method: "lockup_data",
        stack: [],
      }),
      method: "POST",
    }
  ).then((res) => res.json());
};

const payTypeChanged = () => {
  if (buttonType === "withdraw") {
    buttonType = "pay";
  } else if (buttonType === "pay") {
    buttonType = "withdraw";
  }

  updateList();

  document.getElementById("payFormButton").innerText = buttonType;
};

const tokenSelectedChange = () => {
  const newSelectedToken =
    document.getElementById("tokenSelect").selectedOptions[0].value;

  selectedToken = newSelectedToken;

  updateList();
};

const changeUnblockTime = () => {
  let newUnblockTime = document.getElementById("updateUblockTime").value;

  if (!newUnblockTime) {
    return;
  } else {
    const unblockDate = new Date(newUnblockTime);
    newUnblockTime = unblockDate.getTime();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  if (!contractAddress) {
    window.location = "/";

    return;
  }

  document.getElementById("updateUblockTime").min = today;
  document.getElementById("contractId").innerText = contractAddress;

  document.getElementById("payFormButton").innerText = buttonType;

  loadWallets().then(() => {
    Promise.all([
      getContractTonBalance(),
      getContractJettonsBalance(),
      getContractInfo(),
      getContractTonBalance(currentTonWallets[0], userData),
      getContractJettonsBalance(currentTonWallets[0], userData),
      ,
    ]).then(() => {
      updateList();
    });
  });
});
