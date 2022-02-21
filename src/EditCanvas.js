import { useEffect, useState } from "react";
import React from "react";
import { Layer, Stage } from "react-konva";

import { EditLayer } from "./EditLayer";

export const EditCanvas = ({
  existingTiles,
  newTile,
  updateTileCallback,
}) => {
  const [imageAttrs, setImageAttrs] = useState({
    x: newTile && newTile.x ? newTile.x : 0,
    y: newTile && newTile.y ? newTile.y : 0,
    width: newTile && newTile.width ? newTile.width : 100,
    height: newTile && newTile.height ? newTile.height : 100,
    r: newTile && newTile.r ? newTile.r : 0,
  });

  useEffect(() => {
    setImageAttrs({
      x: newTile && newTile.x ? newTile.x : 0,
      y: newTile && newTile.y ? newTile.y : 0,
      width: newTile && newTile.width ? newTile.width : 100,
      height: newTile && newTile.height ? newTile.height : 100,
      r: newTile && newTile.r ? newTile.r : 0,
    });
  }, [newTile]);

  return (
    <div className="canvas">
      <Stage width={1240} height={920}>
        <Layer>
          {existingTiles.map((tile) => (
            <EditLayer
              key={tile.tileId}
              url={tile.image.replace(
                "ipfs://",
                "https://ipfs.infura.io/ipfs/"
              )}
              imgProps={{
                x: tile.x,
                y: tile.y,
                r: tile.r,
                width: tile.width,
                height: tile.height,
              }}
              isSelected={false}
            />
          ))}
          {newTile && (
            <EditLayer
              url={newTile.image.replace(
                "ipfs://",
                "https://ipfs.infura.io/ipfs/"
              )}
              imgProps={imageAttrs}
              isSelected={true}
              onChange={(newAttrs) => {
                setImageAttrs(newAttrs);
                updateTileCallback({
                  ...newTile,
                  x: newAttrs.x,
                  y: newAttrs.y,
                  r: newAttrs.r,
                  width: newAttrs.width,
                  height: newAttrs.height,
                });
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
