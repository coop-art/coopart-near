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
  const [isUploading, setIsUploading] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [newTile, setNewTile] = React.useState();
  const [layers, setLayers] = React.useState();

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
        // window.contract
        //   .get_greeting({ account_id: window.accountId })
        //   .then((greetingFromContract) => {
        //     set_greeting(greetingFromContract);
        //   });
        window.contract.get_layers().then((layersFromContract) => {
          console.log(layersFromContract);
          setLayers(layersFromContract);
        });
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  );

  async function handleMint(tile) {
    try {
      setIsMinting(true);

      // Upload to IPFS

      const json = {
        name: "Coopart Tile",
        description: "Coopart Tile",
        image: tile.image,
        tileId: tile.tileId,
        x: tile.x, // TODO: Store doubles
        y: tile.y,
        r: tile.r,
        width: tile.width,
        height: tile.height,
        deadline: tile.deadline,
      };

      console.log("tile", tile);

      const uploadedJson = await client.add(Buffer.from(JSON.stringify(json)));

      const tokenUri = `ipfs://${uploadedJson.path}`;

      console.log("tokenUri", tokenUri);

      await window.contract.mint_layer(tokenUri);
    } catch (e) {
      alert(
        "Something went wrong! " +
          "Maybe you need to sign out and back in? " +
          "Check your browser console for more info."
      );
      throw e;
    }
    // finally {
    //   window.contract.get_downvotes().then((downvotesFromContract) => {
    //     setDownvotes(downvotesFromContract);
    //   });
    // }

    // // show Notification
    // setShowNotification(true);

    // // remove Notification again after css animation completes
    // // this allows it to be shown again next time the form is submitted
    // setTimeout(() => {
    //   setShowNotification(false);
    // }, 11000);
  }

  // async function handleDownvote() {
  //   try {
  //     // make an update call to the smart contract
  //     await window.contract.increment_downvotes();
  //   } catch (e) {
  //     alert(
  //       "Something went wrong! " +
  //         "Maybe you need to sign out and back in? " +
  //         "Check your browser console for more info."
  //     );
  //     throw e;
  //   } finally {
  //     window.contract.get_downvotes().then((downvotesFromContract) => {
  //       setDownvotes(downvotesFromContract);
  //     });
  //   }

  //   // show Notification
  //   setShowNotification(true);

  //   // remove Notification again after css animation completes
  //   // this allows it to be shown again next time the form is submitted
  //   setTimeout(() => {
  //     setShowNotification(false);
  //   }, 11000);
  // }

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
      <main>
        <div className="action-grid">
          {isUploading ? (
            <div>Uploading...</div>
          ) : (
            <div>
              <label htmlFor="uploader">
                <div className="button">1- Upload Image</div>
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
          {isMinting ? (
            <div>Minting...</div>
          ) : (
            <button onClick={() => handleMint(newTile)}>2- Mint layer</button>
          )}
          <p>
            Participate in the current cooperative canvas and earn a share of
            its selling price.
          </p>
          <button className="link" style={{ float: "right" }} onClick={logout}>
            Sign out
          </button>
        </div>
        {/* <div>Downvotes: {downvotes}</div> */}
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
      Method called in contract:{" "}
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
