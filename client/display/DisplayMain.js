/**
 * Main react component for the Display page.
 */

import React, { useEffect, useState } from 'react';
import styles from './DisplayMain.css';
import PaperLandConsole from './PaperLandConsole.js';
import PaperLandControls from './PaperLandControls.js';
import SceneryDisplay from './SceneryDisplay.js';

export default function DisplayMain( props ) {

  const scene = props.scene;
  const displayConfigObject = props.displayConfigObject;
  const updatePositionInterval = props.updatePositionInterval;
  const updateRemovalDelay = props.updateRemovalDelay;

  const [ consoleVisible, setConsoleVisible ] = useState( true );

  // a reference to the Display object, so it can be handed to various components
  const [ sceneryDisplay, setSceneryDisplay ] = useState( null );

  // React state to control the warning message when waiting for the model component.
  const [ isWatingForModelComponent, setIsWaitingForModelComponent ] = useState( false );

  // Controls the React state from the axon Property.
  useEffect( () => {
    const watchingListener = isWaiting => {
      setIsWaitingForModelComponent( isWaiting );
    };
    phet.paperLand.isWaitingForModelComponentProperty.link( watchingListener );

    // A callback with cleanup work is returned by useEffect for every time this component
    // is rendered
    return () => {
      phet.paperLand.isWaitingForModelComponentProperty.unlink( watchingListener );
    };
  }, [] );


  // Get the scenery display once it is created so it can be passed to various other components
  const modifySceneryDisplay = display => {
    setSceneryDisplay( display );
  };

  return (
    <div>
      <div className={styles.titleContainer}>
        <h1>Interactive Display</h1>
        <p>Add paper programs to Camera to add elements.</p>
      </div>
      <div className={styles.rowContainer}>
        <div className={styles.rowSpacer}>
        </div>
        <div className={styles.displayWithLog}>
          <SceneryDisplay scene={scene} modifyDisplay={modifySceneryDisplay}/>
          <PaperLandConsole consoleVisible={consoleVisible}></PaperLandConsole>
        </div>
        <div className={styles.controls}>
          <div className={styles.paperLandControlsPanel}>
            <PaperLandControls
              initialPositionInterval={displayConfigObject.positionInterval}
              updatePositionInterval={updatePositionInterval}
              initialRemovalDelay={displayConfigObject.removalDelay}
              updateRemovalDelay={updateRemovalDelay}
              updateConsoleVisibility={setConsoleVisible}
              sceneryDisplay={sceneryDisplay}
            ></PaperLandControls>
          </div>
          <p className={styles.warningText} hidden={!isWatingForModelComponent}>&#9888; - Waiting for additional components...</p>
        </div>
      </div>
    </div>
  );
}