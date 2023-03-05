let currentForm = "main";
let retry = true;
let supportedJettons = ["EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"];

const presetJettonAddresses = [
  {
    name: "Huebel Bolt",
    symbol: "BOLT",
    addr: "EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw",
  },
  {
    name: "Grabscape game token",
    symbol: "GRBS",
    addr: "EQBj7uoIVsngmS-ayOz1nHENjZkjTt5mXB4uGa83hmcqq2wA",
  },
  {
    name: "HEDGE coin",
    symbol: "HEDGE",
    addr: "EQBiJ8dSbp3_YAb_KuC64zCrFqQTsFbUee5tbzr5el_HEDGE",
  },
  {
    name: "Scaleton",
    symbol: "SCALE",
    addr: "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",
  },
  {
    name: "TonexCoin",
    symbol: "TNX",
    addr: "EQB-ajMyi5-WKIgOHnbOGApfckUGbl6tDk3Qt8PKmb-xLAvp",
  },
  {
    name: "Ambra",
    symbol: "AMBR",
    addr: "EQCcLAW537KnRg_aSPrnQJoyYjOZkzqYp6FVmRUvN1crSazV",
  },
  {
    name: "Tegro",
    symbol: "TGR",
    addr: "EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y",
  },
  {
    name: "Lavandos",
    symbol: "LAVE",
    addr: "EQBl3gg6AAdjgjO2ZoNU5Q5EzUIl8XMNZrix8Z5dJmkHUfxI",
  },
  {
    name: "Orbit Bridge Ton USD Tether",
    symbol: "oUSDT",
    addr: "EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi",
  },
  {
    name: "Orbit Bridge Ton USD Coin",
    symbol: "oUSDC",
    addr: "EQC61IQRl0_la95t27xhIpjxZt32vl1QQVF2UgTNuvD18W-4",
  },
  {
    name: "TonTake",
    symbol: "TAKE",
    addr: "EQBzyesZ3p1WGNrggNSJi6JFK3vr0GhqJp4gxker9oujjcuv",
  },
  {
    name: "Fanzee Token",
    symbol: "FNZ",
    addr: "EQDCJL0iQHofcBBvFBHdVG233Ri2V4kCNFgfRT-gqAd3Oc86",
  },
  {
    name: "DEFI HUNTERS DAO",
    symbol: "DDAO",
    addr: "EQCW5g1evnQN2OZZEVe-23aSvEsgPauWZlF27ZIz5REhnWRy",
  },
  {
    name: "DHD Coin",
    symbol: "DHD",
    addr: "EQBCFwW8uFUh-amdRmNY9NyeDEaeDYXd9ggJGsicpqVcHq7B",
  },
];

let selectedJettonAddresses = [];

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(
    "https://" +
      (window.localStorage.getItem("testnet") === "true"
        ? "testnet.toncenter.com/api/v2/jsonRPC"
        : "scalable-api.tonwhales.com/jsonRPC"),
    {
      apiKey:
        "971e995b76a2eb21dd0a8a34aec087a75597c27a4fe4f743fb0bcf02a42bfb23",
    }
  )
);
const Cell = tonweb.boc.Cell;

class LockupJettonsContract extends tonweb.Contract {
  constructor(provider, options) {
    options.code = Cell.oneFromBoc(
      "B5EE9C7201020A0100029A000114FF00F4A413F4BCF2C80B01020162020303F6D033D0D303FA403020FA4401C000F2E14D0271B0925F04E003D31FD33F2282107A4C6D4ABA8E29145F04ED4482107A4C6D4AC8CB1F12CB3FCCC9718010C8CB055003CF1670FA0212CB6ACCC98040FB00E0ED44D0F404FA40FA40D33F30236EE302268210D53276DBBA925F0AE02682107362D09CBAE302353636230405060021A1828BDA89A1E809F481F481A67E60AA0500666C5504F404308E188307F4966FA532219BC870FA0240168307F443049130E2B3E630550203C8F40058CF1601CF16CB3FC9ED5401C03653628307F40E6FA18E535F046C22FA00FA4030702082100F8A7EA5C8CB1F15CB3F5003FA0221CF1601CF1612CB0022820AFAF080BE9702820AFAF080A1923220E212FA02CB00C9718018C8CB055003CF1670FA0212CB6ACCC98040FB00E30D0701F48210F6D29301BA8E1D335054C705F2E19102FA4030401303C8F40058CF1601CF16CB3FC9ED54E023821016B628BFBA8E1D335053C705F2E19101FA4030500303C8F40058CF1601CF16CB3FC9ED54E0238210CEBA1400BA8E1F335154C705F2E19104D33F305004B60903C8F40058CF1601CF16CB3FC9ED54E003080050353737C803FA003002FA003012A012FA0240338307F443552003C8F40058CF1601CF16CB3FC9ED54016A8210B5DE5F9EBA8EA55153C705F2E19120F823BBF2E1929324D74A8AE8340303C8F40058CF1601CF16CB3FC9ED54E05F06840FF2F00900F804D401D0FA4021FA443101FA00F4043053258307F40E6FA1226EB3B08E3621D0D31F2182100F8A7EA5BA028210595F07BCBA12B18E1A8040D721C802FA003001FA0030A170B609FA0240368307F44304925B32E2923032E2708018C8CB055004CF1601FA0212CB69216EB3957101CB00CC947032CB00E2C970FB0004"
    );
    super(provider, options);
  }

  createDataCell() {
    const cell = new Cell();
    cell.bits.writeUint(0, 1);
    cell.bits.writeAddress(this.options.ownerAddress);
    cell.bits.writeAddress(this.options.receiverAddress);
    cell.bits.writeUint(this.options.unlockedAt, 64);
    return cell;
  }
}

const resetCreateForm = () => {
  document.getElementById("receiverAddress").value = "";
  document.getElementById("unblockTime").value = "";
  document.getElementById("canChangeTime").checked = "";
  document.getElementById("newJettonAddress").value = "";
};

const resetMainForm = () => {
  document.getElementById("contractAddress").value = "";
};

const renderSelectedAddresses = () => {
  const selectedJettonAddressesContainer =
    document.getElementById("addresses_list");

  selectedJettonAddressesContainer.innerHTML = "";

  selectedJettonAddresses.forEach((jettonAddress) => {
    const jettonAddressNode = createElementFromHTML(
      `<div class="form__address_list_block">
          <span>${jettonAddress.symbol}</span>
          <button
            class="button button--secondary"
            onclick="return removeJettonAddress('${jettonAddress.addr}')"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M20.7071 4.70711C21.0976 4.31658 21.0976 3.68342 20.7071 3.29289C20.3166 2.90237 19.6834 2.90237 19.2929 3.29289L12 10.5858L4.70711 3.29289C4.31658 2.90237 3.68342 2.90237 3.29289 3.29289C2.90237 3.68342 2.90237 4.31658 3.29289 4.70711L10.5858 12L3.29289 19.2929C2.90237 19.6834 2.90237 20.3166 3.29289 20.7071C3.68342 21.0976 4.31658 21.0976 4.70711 20.7071L12 13.4142L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L13.4142 12L20.7071 4.70711Z"
                fill="black"
              />
            </svg>
          </button>
      </div>`
    );

    selectedJettonAddressesContainer.appendChild(jettonAddressNode);
  });
};

const today = new Date().toISOString().slice(0, 16);

// ? Switch forms between create and check contracts
const switchForm = () => {
  if (!window.ton) {
    return;
  }

  if (currentForm === "main") {
    document.querySelector(".form--create").classList.add("form--visible");

    document
      .querySelector(`.form--${currentForm}`)
      .classList.remove("form--visible");

    currentForm = "create";

    document.getElementById("unblockTime").min = today;

    selectedJettonAddresses = [...presetJettonAddresses];

    resetMainForm();
    renderSelectedAddresses();
  } else if (currentForm === "create") {
    document.querySelector(".form--main").classList.add("form--visible");

    document
      .querySelector(`.form--${currentForm}`)
      .classList.remove("form--visible");

    currentForm = "main";

    resetCreateForm();
  }
};

// ? Check contract button submit handler
const checkContract = () => {
  const contractAddress = document.getElementById("contractAddress").value;

  if (!contractAddress) {
    return;
  }

  resetMainForm();

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
  let receiverAddress = document.getElementById("receiverAddress").value;

  if (!receiverAddress) {
    return;
  }

  // ? Contract unblock time ( empty = no time ) ( unixtimestamp = with time )
  let unblockTime = document.getElementById("unblockTime").value;

  // ? Can change unblock time after contract created
  const canChangeTime = document.getElementById("canChangeTime").checked;

  if (unblockTime) {
    const unblockDate = new Date(unblockTime);
    unblockTime = Math.trunc(unblockDate.getTime() / 1000);
  }

  try {
    receiverAddress = new window.TonWeb.Address(receiverAddress);
  } catch {
    receiverAddress = null;
  }

  if (!unblockTime || !receiverAddress) {
    alert("Specify receiver address and unblock time.");
    return;
  }

  window.ton.send("ton_requestAccounts").then(async (accounts) => {
    contract = new LockupJettonsContract(tonweb.provider, {
      ownerAddress: canChangeTime ? new TonWeb.Address(accounts[0]) : null,
      receiverAddress: receiverAddress,
      unlockedAt: unblockTime,
    });
    let contractAddress = (await contract.getAddress()).toString(1, 1, 1);

    let payload = new Cell();
    payload.bits.writeUint(0xd53276db, 32);
    payload.bits.writeUint(0, 64);

    let supportedJettonsMap = new tonweb.boc.HashMap(256);

    const finalSupportedJettons = supportedJettons.concat(
      selectedJettonAddresses.map((jettonData) => {
        return jettonData.addr;
      })
    );

    for (i in finalSupportedJettons) {
      try {
        let jettonRoot = new TonWeb.token.ft.JettonMinter(tonweb.provider, {
          address: new tonweb.utils.Address(finalSupportedJettons[i]),
        });
        jettonRoot = (
          await jettonRoot.getJettonWalletAddress(await contract.getAddress())
        ).toString(1, 1, 1);
        let jettonCell = new tonweb.boc.Cell();
        jettonCell.bits.writeCoins(tonweb.utils.toNano("1"));
        console.log(jettonRoot, jettonCell);
        supportedJettonsMap.elements[jettonRoot] = jettonCell;
      } catch (e) {
        console.log(e);
        let jettonRoot = finalSupportedJettons[i];
        let jettonCell = new tonweb.boc.Cell();
        jettonCell.bits.writeCoins(tonweb.utils.toNano("1"));
        console.log(jettonRoot, jettonCell);
        supportedJettonsMap.elements[jettonRoot] = jettonCell;
      }
    }

    payload.bits.writeUint(1, 1);
    payload.refs.push(
      supportedJettonsMap.serialize(
        (_e) => {
          let c = new tonweb.boc.Cell();
          c.bits.writeBytes(new tonweb.utils.Address(_e).hashPart);
          return c;
        },
        (_e) => {
          return _e;
        }
      )
    );

    let query = {
      to: contractAddress,
      value: "50000000",
      data: tonweb.utils.bytesToBase64(await payload.toBoc(false)),
      dataType: "boc",
      stateInit: tonweb.utils.bytesToBase64(
        await (await contract.createStateInit()).stateInit.toBoc(false)
      ),
    };

    const payed = await window.ton.send("ton_sendTransaction", [query]);

    if (payed === true) {
      openContractPage(contractAddress);

      resetCreateForm();
    }
  });
};

const removeJettonAddress = (addressToRemove) => {
  const findJettonAddressIndex = selectedJettonAddresses.findIndex(
    (jettonData) => {
      return jettonData.addr === addressToRemove;
    }
  );

  if (findJettonAddressIndex < 0) {
    return;
  }

  selectedJettonAddresses.splice(findJettonAddressIndex, 1);

  renderSelectedAddresses();
};

const addJettonAddress = () => {
  const newJettonAddressElement = document.getElementById("newJettonAddress");
  const newJettonAddress = newJettonAddressElement.value;

  if (!newJettonAddress) {
    return;
  }

  const isJettonAdded = selectedJettonAddresses.findIndex((jettonData) => {
    return jettonData.addr === newJettonAddress;
  });

  if (isJettonAdded >= 0) {
    return;
  }

  newJettonAddressElement.value = "";
  selectedJettonAddresses.unshift({
    addr: newJettonAddress,
    symbol: newJettonAddress,
  });
  renderSelectedAddresses();
};

const domLoaded = () => {
  const isTonExtensionExist = window.ton;

  if (!isTonExtensionExist && !retry) {
    document.querySelector(`.form--no-ton`).classList.add("form--visible");
  }

  if (isTonExtensionExist) {
    document.querySelector(`.form--no-ton`).classList.remove("form--visible");
    document.querySelector(`.form--main`).classList.add("form--visible");
  }

  if (!isTonExtensionExist && retry) {
    retry = false;

    setTimeout(() => {
      domLoaded();
    }, 1000);
  }
};

window.addEventListener("DOMContentLoaded", domLoaded);
