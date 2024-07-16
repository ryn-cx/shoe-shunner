// ==UserScript==
// @name         Shoe Shunner
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Shuns shoes that are overpriced, making it easier to identify
//               new shoes or shoes that have had a price drop.
// @author       ryn.cx
// @match        https://stockx.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stockx.com
// @grant        none
// ==/UserScript==
// Configuration variables
// There's no real reason to change this value, but it is the prefix used
// throughout the userscript to mark elements and store data.
var uniqueIdentifier = 'shoe-shunner';
var interestedSaveText = 'NICE';
var interestedUndoText = 'Undo';
var interestedColor = 'blue';
var interestedPriceDropColor = 'green';
var notInterestedSaveText = 'NAW';
var notInterestedUndoText = 'Undo';
var notInterestedColor = 'red';
var notInterestedPriceDropColor = 'yellow';
function addButtonToHeader(header) {
    var button = document.createElement('button');
    header.appendChild(button);
    button.textContent = 'Resync';
    // When the button is clicked delete all of the marking to the site
    // to resync them. This is a temporary fix until I figure out why it
    // sometimes gets desynced.
    button.addEventListener('click', function () {
        var divs = document.querySelectorAll("div[class*=\"".concat(uniqueIdentifier, "\"]"));
        divs.forEach(function (div) {
            div.remove();
        });
    });
}
function addButtonToShoes() {
    var divs = document.querySelectorAll('div[class$="GridProductTileContainer"]');
    divs.forEach(function (div) {
        // Do nothing if the button already exist, this is the easiest way to
        // detect when the page changes and update accordingly.
        if (div.querySelector(".".concat(uniqueIdentifier))) {
            return;
        }
        var divAsElement = div;
        var link = div.querySelector('a[data-testid="productTile-ProductSwitcherLink"]');
        if (link === null) {
            throw new Error("Unable to extract the link to the shoe");
        }
        var mainShoeNode = link.parentNode;
        if (mainShoeNode === null) {
            throw new Error("Unable to extract the main shoe node");
        }
        var p = mainShoeNode.querySelector('p[data-testid="product-tile-lowest-ask-amount"]');
        if (p === null) {
            throw new Error("Unable to find the price of the shoe");
        }
        var shoePriceString = p.textContent;
        if (shoePriceString === null) {
            throw new Error("Unable to extract the price of the shoe");
        }
        var link_url = link.getAttribute('href');
        var price = parseInt(shoePriceString.replace("$", ""));
        var buttonsDiv = document.createElement('div');
        p.append(buttonsDiv);
        buttonsDiv.style.cssText = 'display: flex; justify-content: space-between; width: 200px; border: 1px solid black; padding: 10px;';
        buttonsDiv.className = uniqueIdentifier;
        var buttonDiv1 = document.createElement('div');
        buttonsDiv.appendChild(buttonDiv1);
        var interestedButton = document.createElement('button');
        buttonDiv1.appendChild(interestedButton);
        var interestedStorageName = uniqueIdentifier + "-interested" + link_url;
        var interestedSavedString = localStorage.getItem(interestedStorageName);
        var interestedSavedPrice = null;
        if (interestedSavedString) {
            interestedSavedPrice = parseInt(interestedSavedString);
        }
        buttonDiv1.addEventListener('click', function (event) {
            // Stop the parent link from activating when the button is clicked
            event.preventDefault();
            if (interestedButton.textContent === interestedSaveText) {
                localStorage.setItem(interestedStorageName, price.toString());
                divAsElement.style.backgroundColor = interestedColor;
                interestedButton.textContent = interestedUndoText;
            }
            else {
                localStorage.removeItem(interestedStorageName);
                divAsElement.style.removeProperty('background-color');
                interestedButton.textContent = interestedSaveText;
            }
        });
        var buttonDivReal2 = document.createElement('div');
        buttonsDiv.appendChild(buttonDivReal2);
        var buttonDiv2 = document.createElement('div');
        buttonsDiv.appendChild(buttonDiv2);
        var notInterestedButton = document.createElement('button');
        buttonDiv2.appendChild(notInterestedButton);
        var notInterestedStorageName = uniqueIdentifier + "-not-interested" + link_url;
        var notInterestedSavedString = localStorage.getItem(notInterestedStorageName);
        var notInterestedSavedPrice = null;
        if (notInterestedSavedString) {
            notInterestedSavedPrice = parseInt(notInterestedSavedString);
        }
        buttonDiv2.addEventListener('click', function (event) {
            // Stop the parent link from activating when the button is clicked
            event.preventDefault();
            if (notInterestedButton.textContent === notInterestedSaveText) {
                localStorage.setItem(notInterestedStorageName, price.toString());
                divAsElement.style.backgroundColor = notInterestedColor;
                notInterestedButton.textContent = notInterestedUndoText;
            }
            else {
                localStorage.removeItem(notInterestedStorageName);
                divAsElement.style.removeProperty('background-color');
                notInterestedButton.textContent = notInterestedSaveText;
            }
        });
        // Just in case both buttons are clicked at once accidently
        if (interestedSavedPrice && notInterestedSavedPrice) {
            divAsElement.style.backgroundColor = "purple";
        }
        if (interestedSavedPrice) {
            var priceChange = interestedSavedPrice - price;
            var percentageChange = (priceChange / interestedSavedPrice) * 100;
            buttonDivReal2.textContent = priceChange.toString();
            if (percentageChange >= 10) {
                divAsElement.style.backgroundColor = interestedPriceDropColor;
                interestedButton.textContent = interestedSaveText;
            }
            else {
                divAsElement.style.backgroundColor = interestedColor;
                interestedButton.textContent = interestedUndoText;
            }
        }
        else {
            interestedButton.textContent = interestedSaveText;
        }
        if (notInterestedSavedPrice) {
            var priceChange = notInterestedSavedPrice - price;
            var percentageChange = (priceChange / notInterestedSavedPrice) * 100;
            buttonDivReal2.textContent = priceChange.toString();
            if (percentageChange >= 10) {
                divAsElement.style.backgroundColor = notInterestedPriceDropColor;
                notInterestedButton.textContent = notInterestedSaveText;
            }
            else {
                divAsElement.style.backgroundColor = notInterestedColor;
                notInterestedButton.textContent = notInterestedUndoText;
            }
        }
        else {
            notInterestedButton.textContent = notInterestedSaveText;
        }
    });
}
(function () {
    'use strict';
    var updateShoeButtons = setInterval(function () {
        addButtonToShoes();
    }, 1000);
    var insertHeaderButton = setInterval(function () {
        var header = document.querySelector('div[class="css-b1ilzc"]');
        if (header) {
            addButtonToHeader(header);
            clearInterval(insertHeaderButton);
        }
    }, 100);
})();
