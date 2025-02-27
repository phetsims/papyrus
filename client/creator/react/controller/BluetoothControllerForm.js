/**
 * Form for creating a BluetoothListenerComponent. Shown under the "Controller" section.
 */

import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import bluetoothServiceData from '../../../common/bluetoothServiceData.js';
import { isNameValid } from '../../../utils.js';
import Component from '../../model/Component.js';
import BluetoothListenerComponent from '../../model/controllers/BluetoothListenerComponent.js';
import AIHelperChat from '../AIHelperChat.js';
import ComponentSetterList from '../ComponentSetterList.js';
import CreateComponentButton from '../CreateComponentButton.js';
import CreatorMonacoEditor from '../CreatorMonacoEditor.js';
import DocumentationList from '../DocumentationList.js';
import FormInvalidReasons from '../FormInvalidReasons.js';
import ModelComponentSelector from '../ModelComponentSelector.js';
import useEditableForm from '../useEditableForm.js';
import VariableDocumentationList from '../VariableDocumentationList.js';
import styles from './../../CreatorMain.css';

/**
 * From the state of the active edit, determine which tab should be selected.
 */
const getTabForActiveEdit = activeEdit => {
  if ( activeEdit && activeEdit.component instanceof BluetoothListenerComponent && activeEdit.component.writeToCharacteristic ) {
    return 'write';
  }
  else {
    return 'read';
  }
};

export default function BluetoothControllerForm( props ) {

  // List of all possible model components.
  const allModelComponents = props.allModelComponents;

  // A description of the object that is currently being edited in Creator.
  const activeEditProperty = props.activeEditProperty;

  // The ActiveEdit being used by React forms.
  const activeEdit = props.activeEdit;

  // The name of this component.
  const componentName = props.componentName;

  // Reference ot the CreatorModel.
  const model = props.model;

  // State describing why the form is not valid yet.
  const [ formInvalidReasons, setFormInvalidReasons ] = useState( [] );

  // The function that determines if the form is valid, needs to be updated when formData and name
  // change
  const getIsFormValid = currentFormData => {
    const controlledGood = currentFormData.controlledPropertyNames.length > 0;
    const dependenciesGood = currentFormData.dependencyNames.length > 0;
    const controlFunctionGood = currentFormData.controlFunctionString.length > 0;
    const serviceIdGood = currentFormData.serviceId.length > 0;
    const characteristicIdGood = currentFormData.characteristicId.length > 0;
    const writingToCharacteristic = currentFormData.writeToCharacteristic;

    const invalidReasons = [];
    if ( !writingToCharacteristic && !controlledGood ) {
      invalidReasons.push( 'Must select at least one controlled component if reading from device.' );
    }
    if ( writingToCharacteristic && !dependenciesGood ) {
      invalidReasons.push( 'Must select at least one dependency component if writing to device.' );
    }
    if ( !controlFunctionGood ) {
      invalidReasons.push( 'The control function is required.' );
    }
    if ( !serviceIdGood ) {
      invalidReasons.push( 'The service UUID is required.' );
    }
    if ( !characteristicIdGood ) {
      invalidReasons.push( 'The characteristic UUID is required.' );
    }
    return invalidReasons;
  };

  const [ formData, handleChange ] = useEditableForm(
    props.activeEdit,
    valid => {
      setFormInvalidReasons( valid );
    },
    data => {
      return getIsFormValid( data );
    },
    props.getFormData,
    BluetoothListenerComponent
  );

  const [ selectedTab, setSelectedTab ] = useState( 'write' );
  const [ writeTabEnabled, setWriteTabEnabled ] = useState( true );
  const [ readTabEnabled, setReadTabEnabled ] = useState( true );

  useEffect( () => {
    setFormInvalidReasons( getIsFormValid( formData ) );
  }, [ componentName ] );

  // Set the selected tab when the active edit changes
  useEffect( () => {
    setSelectedTab( getTabForActiveEdit( activeEdit ) );
  }, [ activeEdit ] );

  // When a new service is selected, if the characteristic ID is empty, set it to the first one in the list. This
  // is convenient for services with only one characteristic.
  useEffect( () => {

    if ( formData.characteristicId === '' && formData.serviceId ) {
      const characteristicDescriptors = bluetoothServiceData.getCharacteristicDescriptorsForService( formData.serviceId );
      if ( characteristicDescriptors.length > 0 ) {
        handleChange( { characteristicId: characteristicDescriptors[ 0 ].characteristicUUID } );
      }
    }
  }, [ formData.serviceId ] );

  // When the characteristic changes, update the tabs to the appropriate read/write values depending
  // what the characteristic supports.
  useEffect( () => {
    const characteristicDescriptor = bluetoothServiceData.getCharacteristicDescriptorForCharacteristicId( formData.characteristicId );
    if ( characteristicDescriptor ) {
      setSelectedTab( characteristicDescriptor.write ? 'write' : 'read' );
      handleChange( { writeToCharacteristic: characteristicDescriptor.write } );

      setWriteTabEnabled( characteristicDescriptor.write );
      setReadTabEnabled( characteristicDescriptor.read );
    }
  }, [ formData.characteristicId ] );

  // Get the references to the actual model components from selected form data (name strings)
  const controlledModelComponents = Component.findComponentsByName( allModelComponents, formData.controlledPropertyNames );
  const dependencyModelComponents = Component.findComponentsByName( allModelComponents, formData.dependencyNames );
  const referenceModelComponents = Component.findComponentsByName( allModelComponents, formData.referenceComponentNames );

  // The Properties that you can control are all the Properties minus the selected model components
  const controllableComponents = allModelComponents.filter( component => {
    return !controlledModelComponents.includes( component );
  } );

  const createComponent = () => {
    if ( props.activeEdit && props.activeEdit.component instanceof BluetoothListenerComponent ) {
      const component = props.activeEdit.component;
      component.nameProperty.value = props.componentName;
      component.setControlledProperties( controlledModelComponents );
      component.setDependencies( dependencyModelComponents );
      component.setReferenceComponentNames( formData.referenceComponentNames );
      component.controlFunctionString = formData.controlFunctionString;
      component.writeToCharacteristic = formData.writeToCharacteristic;
      component.serviceId = formData.serviceId;
      component.characteristicId = formData.characteristicId;
    }
    else {
      const bluetoothComponent = new BluetoothListenerComponent(
        props.componentName,
        dependencyModelComponents,
        controlledModelComponents,
        formData.controlFunctionString,
        formData.writeToCharacteristic,
        formData.serviceId,
        formData.characteristicId
      );

      // assign the reference component names
      bluetoothComponent.setReferenceComponentNames( formData.referenceComponentNames );

      props.activeEdit.program.listenerContainer.addBluetoothListener( bluetoothComponent );
    }

    props.onComponentCreated();
  };

  return (
    <div>

      {/* UUID Text Inputs */}
      <h3>Bluetooth Service</h3>
      <Form.Label>Select the Bluetooth Service you want to use from your microcontroller:</Form.Label>
      <ServiceSelector
        formData={formData}
        onChange={event => {
          handleChange( {
            serviceId: event.target.value,

            // Clear out the characteristic ID when the service is changed by the user because the old
            // characteristic is probably no longer valid.
            characteristicId: ''
          } );
        }}
      ></ServiceSelector>

      <Form.Label>Select the Bluetooth Characteristic you want to use from the selected BLE Service:</Form.Label>
      <CharacteristicSelector
        formData={formData}
        onChange={event => {
          handleChange( { characteristicId: event.target.value } );
        }}
      ></CharacteristicSelector>

      {/* UUID Readout */}
      <UUIDReadOut
        serviceId={formData.serviceId}
        characteristicId={formData.characteristicId}
      ></UUIDReadOut>
      <hr></hr>

      {/* Component selection and control function, different contents depending on read/write. */}
      <Tabs
        activeKey={selectedTab}
        className={styles.tabs}
        variant={'tabs'}
        onSelect={( eventKey ) => {

          // When the tab changes, update the write type on the component
          handleChange( { writeToCharacteristic: eventKey === 'write' } );
          setSelectedTab( eventKey );
        }}
        justify={true}
      >
        <Tab eventKey='read' title='Read' tabClassName={styles.tab} disabled={!readTabEnabled}>
          <h3>Controlled Components</h3>
          <p>A value is read from the bluetooth device. Select components you want to be controlled by the device.</p>
          <Container>
            <ModelComponentSelector
              allModelComponents={controllableComponents}
              selectedModelComponents={controlledModelComponents}

              // All dependencies in this section are controlled - they are updated by the control function
              hideDependencyControl={true}

              handleChange={selectedComponents => {
                handleChange( {
                  controlledPropertyNames: selectedComponents.map( component => component.nameProperty.value )
                } );
              }}
            />
          </Container>
          <hr></hr>
          <ComponentSetterList
            components={controlledModelComponents}
            helperPrompt={'Use the following functions in your code to update model components. The device value is in a variable called `deviceValue`. Remember to decode it from the format of you device.'}
          ></ComponentSetterList>
          <DocumentationList
            helperPrompt={'Use the following functions in your code to write to the device.'}
            items={[
              { name: 'deviceValue', documentation: 'The value provided by the device. Remember to decode it from the format of your device.' },
              { name: 'deviceValueString', documentation: 'The value provided by the device decoded from UTF-8 as a string.' }
            ]}
          ></DocumentationList>
          <CreatorMonacoEditor
            controlFunctionString={formData.controlFunctionString}
            handleChange={newValue => {
              handleChange( { controlFunctionString: newValue } );
            }}>
          </CreatorMonacoEditor>
        </Tab>
        <Tab eventKey='write' title='Write' tabClassName={styles.tab} disabled={!writeTabEnabled}>
          <h3>Dependency Components</h3>
          <p>Select components that should control the device.</p>
          <Container>
            <ModelComponentSelector
              allModelComponents={allModelComponents}
              selectedModelComponents={dependencyModelComponents}
              referenceComponentNames={formData.referenceComponentNames}
              handleChange={( ( selectedComponents, referenceComponentNames ) => {
                const changeObject = {
                  dependencyNames: selectedComponents.map( component => component.nameProperty.value )
                };

                // If the second argument is null, this means a change (likely adding) to the model components but
                // no change to the reference components.
                if ( referenceComponentNames ) {
                  changeObject.referenceComponentNames = referenceComponentNames;
                }

                handleChange( changeObject );
              } )}
            />
          </Container>
          <hr></hr>
          <VariableDocumentationList
            functionPrompt={'Use available variables to calculate a value.'}
            components={dependencyModelComponents}
          ></VariableDocumentationList>
          <DocumentationList
            helperPrompt={'Use the following functions in your code to write to the device.'}
            items={[
              { name: 'writeToCharacteristic( value )', documentation: 'Write a value to the characteristic. Remember to encode the value to a format expected by the device.' },
              { name: 'writeStringToCharacteristic( valueString )', documentation: 'Write a string to the characteristic. The string is wrapped with data delimeter "$" and string delimiter "|". The string is then encoded as a UTF-8 Uint8Array.' },
              { name: 'writeStringToCharacteristic( valueString, startDelim, endDelim )', documentation: 'Write a string to the characteristic. The string is wrapped with the provided data and string delimeters. The string is then encoded as a UTF-8 Uint8Array.' },
              { name: 'writeMatrixToCharacteristic( matrix )', documentation: 'Matrix is a 5x5 2D array of 1s and 0s, corresponding to the LEDs you want to light up. It is encoded for you.' }
            ]}
          ></DocumentationList>
          <CreatorMonacoEditor
            controlFunctionString={formData.controlFunctionString}
            handleChange={newValue => {
              handleChange( { controlFunctionString: newValue } );
            }}>
          </CreatorMonacoEditor>
        </Tab>
      </Tabs>

      <hr></hr>

      <AIHelperChat
        settableComponents={controlledModelComponents}
        variableComponents={controlledModelComponents}
      ></AIHelperChat>
      <FormInvalidReasons invalidReasons={formInvalidReasons} componentNameValid={isNameValid( activeEditProperty.value, model, componentName )}></FormInvalidReasons>
      <CreateComponentButton
        createComponent={createComponent}
        selectedTabFormValid={formInvalidReasons.length === 0 && isNameValid( activeEditProperty.value, model, componentName )}
        activeEditProperty={activeEditProperty}
      ></CreateComponentButton>
    </div>
  );
}

const ServiceSelector = ( props ) => {
  const handleChange = props.onChange;
  if ( !handleChange ) {
    throw new Error( 'ServiceSelector requires an onChange prop.' );
  }

  const formData = props.formData;
  if ( !formData ) {
    throw new Error( 'ServiceSelector requires a formData prop.' );
  }

  return (
    <Form.Select
      onChange={handleChange}
      value={formData.serviceId}
    >
      <option value={''}>Select a service</option>
      {
        Array.from( bluetoothServiceData.serviceDescriptorToCharacteristicDescriptorMap.keys() ).map( serviceDescriptor => {
          return <option
            value={serviceDescriptor.serviceUUID}
            key={serviceDescriptor.serviceUUID}>
            {`${serviceDescriptor.name}`}
          </option>
        } )
      }
    </Form.Select>
  );
}

const CharacteristicSelector = ( props ) => {
  const handleChange = props.onChange;
  if ( !handleChange ) {
    throw new Error( 'CharacteristicSelector requires an onChange Prop.' );
  }

  const formData = props.formData;
  if ( !formData ) {
    throw new Error( 'CharacteristicSelector requires a formData prop.' );
  }

  // The available options for the characteristic selector will depend on the service selected.
  const serviceId = formData.serviceId;
  let characteristicDescriptors = [];

  if ( serviceId ) {

    // The characteristic descriptors for the selected service.
    characteristicDescriptors = bluetoothServiceData.getCharacteristicDescriptorsForService( serviceId );
  }
  else {

    // No service selected so no characteristics available.
    characteristicDescriptors = [];
  }


  return (
    <Form.Select
      onChange={handleChange}
      value={formData.characteristicId}
    >
      <option value={''}>Select a characteristic</option>

      {
        characteristicDescriptors.map( characteristicDescriptor => {
          return <option
            value={characteristicDescriptor.characteristicUUID}
            key={characteristicDescriptor.characteristicUUID}>
            {`${characteristicDescriptor.name}`}
          </option>
        } )
      }
    </Form.Select>
  );
}

/**
 * Displays the selected service and characteristic UUIDs for reference.
 */
const UUIDReadOut = ( props ) => {
  return (
    <div className={styles.verticalPadding}>
      <p>Service UUID: {props.serviceId}</p>
      <p>Characteristic UUID: {props.characteristicId}</p>
    </div>
  );
}