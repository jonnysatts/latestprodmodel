import React, { useState } from 'react';
import IsolatedInput from './IsolatedInput';
import IsolatedSelect from './IsolatedSelect';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const TestInputs: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [numberValue, setNumberValue] = useState<number>(0);
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Isolated Input Components</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Text Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <IsolatedInput
              label="Text Input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter some text"
              id="test-input"
            />
            <div className="mt-2 p-2 bg-gray-100 rounded">
              Value: {inputValue}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Number Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <IsolatedInput
              label="Number Input"
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(Number(e.target.value))}
              placeholder="Enter a number"
              id="test-number"
              min={0}
              max={100}
              step={1}
            />
            <div className="mt-2 p-2 bg-gray-100 rounded">
              Value: {numberValue}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Textarea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <IsolatedInput
              label="Textarea"
              isTextarea={true}
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              placeholder="Enter multiple lines of text"
              id="test-textarea"
              rows={4}
            />
            <div className="mt-2 p-2 bg-gray-100 rounded">
              Value: {textareaValue}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Select</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <IsolatedSelect
              label="Select Dropdown"
              options={selectOptions}
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              placeholder="Choose an option"
              id="test-select"
            />
            <div className="mt-2 p-2 bg-gray-100 rounded">
              Value: {selectValue}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Form State</h2>
        <pre className="p-4 bg-gray-800 text-white rounded">
          {JSON.stringify({
            inputValue,
            numberValue,
            textareaValue,
            selectValue
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestInputs; 