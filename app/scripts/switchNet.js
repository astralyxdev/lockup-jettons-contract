const createElementFromHTML = (htmlString) => {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();

  return div.firstChild;
};

const switchNetStatus = () => {
  const testNetChecked = document.getElementById("switchNet").checked;

  window.localStorage.setItem("testnet", testNetChecked);
};

const drawSwitch = () => {
  if (!window.ton) {
    return;
  }

  const isTestNetEnabled = window.localStorage.getItem("testnet");

  document.body.prepend(
    createElementFromHTML(`<div class="netSwitch">
      <span>mainNet</span>
      <label class="switch__wrapper">
          <input type="checkbox" class="switch__content" id="switchNet" onchange="return switchNetStatus()" />
          <span class="switch__slider"></span>
      </label>
      <span>testNet</span>
      </div>`)
  );

  document.getElementById("switchNet").checked = isTestNetEnabled === "true";
};

window.addEventListener("storage", () => drawSwitch());
window.addEventListener("DOMContentLoaded", () => drawSwitch());
