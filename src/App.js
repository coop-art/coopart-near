import dayjs from "dayjs";
import { create } from "ipfs-http-client";
import React from "react";

import getConfig from "./config";
import { EditCanvas } from "./EditCanvas";
import { login, logout } from "./utils";

import "./global.css";
import "regenerator-runtime/runtime";

const { networkId } = getConfig(process.env.NODE_ENV || "development");
const client = create({ url: "https://ipfs.infura.io:5001/api/v0" });

export default function App() {
  // use React Hooks to store greeting in component state
  const [greeting, set_greeting] = React.useState();
  const [isUploading, setIsUploading] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [newTile, setNewTile] = React.useState();
  const [downvotes, setDownvotes] = React.useState();

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true);

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false);

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {
        // window.contract is set by initContract in index.js
        window.contract
          .get_greeting({ account_id: window.accountId })
          .then((greetingFromContract) => {
            set_greeting(greetingFromContract);
          });
        window.contract.get_downvotes().then((downvotesFromContract) => {
          setDownvotes(downvotesFromContract);
        });
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  );

  async function handleDownvote() {
    try {
      // make an update call to the smart contract
      await window.contract.increment_downvotes();
    } catch (e) {
      alert(
        "Something went wrong! " +
          "Maybe you need to sign out and back in? " +
          "Check your browser console for more info."
      );
      throw e;
    } finally {
      window.contract.get_downvotes().then((downvotesFromContract) => {
        setDownvotes(downvotesFromContract);
      });
    }

    // show Notification
    setShowNotification(true);

    // remove Notification again after css animation completes
    // this allows it to be shown again next time the form is submitted
    setTimeout(() => {
      setShowNotification(false);
    }, 11000);
  }

  async function handleUpload(file) {
    const tileId = Math.floor(Math.random() * 1000000); //TODO: Implement better tileId
    const deadline = dayjs().add(7, "days").format();

    try {
      setIsUploading(true);

      // Upload to IPFS
      const uploadedImage = await client.add(file);

      // Get image size
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (e) {
        var image = new Image();
        //@ts-ignore
        image.src = e.target.result;
        image.onload = function () {
          //@ts-ignore
          console.log("onload", this.width, this.height);
          setNewTile({
            tileId,
            canvasId: 1,
            x: 0,
            y: 0,
            r: 0,
            image: `ipfs://${uploadedImage.path}`,
            deadline,
            //@ts-ignore
            width: this.width,
            //@ts-ignore
            height: this.height,
          });

          setIsUploading(false);
        };
      };
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  }

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to CoopArt!</h1>
        <p>
          Coopart [ koh-op-ahrt ] is the first-ever cooperative layer-based NFT
          art marketplace.
          <br />
          <br />
          1- Create a canvas and add the first layer.
          <br />
          2- Other artists add new layers.
          <br />
          3- People can vote layers in or out. Each canvas is its own DAO and
          self-governs.
          <br />
          4- Canvas is sold and profits distributed to all its contributors.
        </p>
        <p>
          Go ahead and click the button below to take part in the current canvas
          round:
        </p>
        <p style={{ textAlign: "center", marginTop: "2.5em" }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    );
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: "right" }} onClick={logout}>
        Sign out
      </button>
      <main>
        {isUploading ? (
          <div>Uploading...</div>
        ) : (
          <div>
            <label htmlFor="uploader">
              <div
                style={{
                  backgroundColor: "#0072ce",
                  borderRadius: "5px",
                  color: "#efefef",
                  cursor: "pointer",
                }}
              >
                Upload Image
              </div>
            </label>
            <input
              hidden
              id="uploader"
              type="file"
              accept="image/*"
              onChange={(e) => {
                e.target &&
                  e.target.files &&
                  e.target.files[0] &&
                  handleUpload(e.target.files[0]);
              }}
            />
          </div>
        )}

        <h1>
          <label
            htmlFor="greeting"
            style={{
              color: "var(--secondary)",
              borderBottom: "2px solid var(--secondary)",
            }}
          >
            {greeting}
          </label>
          {
            " " /* React trims whitespace around tags; insert literal space character when needed */
          }
          {window.accountId}!
        </h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            // get elements from the form using their id attribute
            const { fieldset, greeting } = event.target.elements;

            // hold onto new user-entered value from React's SynthenticEvent for use after `await` call
            const newGreeting = greeting.value;

            // disable the form while the value gets updated on-chain
            fieldset.disabled = true;

            try {
              // make an update call to the smart contract
              await window.contract.set_greeting({
                // pass the value that the user entered in the greeting field
                message: newGreeting,
              });
            } catch (e) {
              alert(
                "Something went wrong! " +
                  "Maybe you need to sign out and back in? " +
                  "Check your browser console for more info."
              );
              throw e;
            } finally {
              // re-enable the form, whether the call succeeded or failed
              fieldset.disabled = false;
            }

            // update local `greeting` variable to match persisted value
            set_greeting(newGreeting);

            // show Notification
            setShowNotification(true);

            // remove Notification again after css animation completes
            // this allows it to be shown again next time the form is submitted
            setTimeout(() => {
              setShowNotification(false);
            }, 11000);
          }}
        >
          <fieldset id="fieldset">
            <label
              htmlFor="greeting"
              style={{
                display: "block",
                color: "var(--gray)",
                marginBottom: "0.5em",
              }}
            >
              Change greeting
            </label>
            <div style={{ display: "flex" }}>
              <input
                autoComplete="off"
                defaultValue={greeting}
                id="greeting"
                onChange={(e) => setButtonDisabled(e.target.value === greeting)}
                style={{ flex: 1 }}
              />
              <button
                disabled={buttonDisabled}
                style={{ borderRadius: "0 5px 5px 0" }}
              >
                Save
              </button>
            </div>
          </fieldset>
        </form>
        <p>
          Participate in the current cooperative canvas and earn a share of its
          selling price.
        </p>
        <button onClick={() => handleDownvote()}>Downvote</button>
        <div>Downvotes: {downvotes}</div>
        <EditCanvas
          existingTiles={[]}
          newTile={newTile}
          updateTileCallback={(tile) => setNewTile(tile)}
        />
      </main>
      {showNotification && <Notification />}
    </>
  );
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`;
  return (
    <aside>
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.accountId}`}
      >
        {window.accountId}
      </a>
      {
        " " /* React trims whitespace around tags; insert literal space character when needed */
      }
      called method: 'set_greeting' in contract:{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.contract.contractId}`}
      >
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  );
}
