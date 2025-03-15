import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

function MethodSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Method" />
      </SelectTrigger>
      <SelectContent>
        {HTTP_METHODS.map((method) => (
          <SelectItem key={method} value={method}>
            <span
              className={
                method === 'GET'
                  ? 'text-green-600 font-medium'
                  : method === 'POST'
                  ? 'text-blue-600 font-medium'
                  : method === 'PUT'
                  ? 'text-amber-600 font-medium'
                  : method === 'DELETE'
                  ? 'text-red-600 font-medium'
                  : 'font-medium'
              }
            >
              {method}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default MethodSelect;