import { Fragment, useEffect, useRef, useState } from 'react'
import React from "react";
import { Image, Transformer } from 'react-konva'

export const EditLayer = ({ imgProps, url, isSelected, onSelect, onChange }) => {
  const [image, setImage] = useState()

  useEffect(() => {
    const image = new window.Image()
    image.src = url
    image.addEventListener('load', () => setImage(image))
  }, [url])

  const imgRef = useRef()
  const trRef = useRef()

  useEffect(() => {
    if (isSelected) {
      //@ts-ignore
      trRef.current.nodes([imgRef.current])
      //@ts-ignore
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  console.log('imgProps', imgProps)

  return (
    <Fragment>
      <Image
        image={image}
        onClick={onSelect}
        onTap={onSelect}
        ref={imgRef}
        rotationDeg={imgProps.r}
        {...imgProps}
        draggable={isSelected}
        onDragEnd={(e) => {
          onChange({
            ...imgProps,
            x: e.target.x(),
            y: e.target.y(),
            r: e.target.rotation(),
          })
        }}
        onTransformEnd={(e) => {
          const node = imgRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)
          onChange({
            ...imgProps,
            x: node.x(),
            y: node.y(),
            r: node.rotation(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          })
        }}
      />
      {isSelected && (
        <Transformer
          //@ts-ignore
          ref={trRef}
          centeredScaling={false}
          rotationSnaps={[0, 90, 180, 270]}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </Fragment>
  )
}
