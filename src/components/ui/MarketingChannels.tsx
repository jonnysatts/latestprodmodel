import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

interface MarketingChannelProps {
  onChange?: (data: unknown) => void;
  value?: any;
}

export function MarketingChannels({ onChange, value = {} }: MarketingChannelProps) {
  const [channel, setChannel] = React.useState(value.channel || '');
  const [budget, setBudget] = React.useState(value.budget || 0);
  const [notes, setNotes] = React.useState(value.notes || '');

  const handleChannelChange = (newChannel: string) => {
    setChannel(newChannel);
    if (onChange) {
      onChange({
        channel: newChannel,
        budget,
        notes
      });
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (onChange) {
      onChange({
        channel,
        budget,
        notes: e.target.value
      });
    }
  };

  return (
    <div className="marketing-channels space-y-4">
      {/* Dropdown wrapper with fixed positioning and highest z-index */}
      <div>
        <Label htmlFor="marketing-channel">Marketing Channel</Label>
        <div className="relative">
          <Select
            value={channel}
            onValueChange={handleChannelChange}
          >
            <SelectTrigger id="marketing-channel" className="w-full">
              <SelectValue placeholder="Select marketing channel" />
            </SelectTrigger>
            <SelectContent 
              className="bg-white shadow-lg" 
              position="popper"
              sideOffset={4}
              align="start"
              avoidCollisions={true}
            >
              <SelectItem value="Social Media Advertising">Social Media Advertising</SelectItem>
              <SelectItem value="Google/Search Ads">Google/Search Ads</SelectItem>
              <SelectItem value="Print Media">Print Media</SelectItem>
              <SelectItem value="Email Marketing">Email Marketing</SelectItem>
              <SelectItem value="Influencer Partnerships">Influencer Partnerships</SelectItem>
              <SelectItem value="Referral Programs">Referral Programs</SelectItem>
              <SelectItem value="Other (Custom)">Other (Custom)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Budget field with proper spacing */}
      <div className="space-y-2">
        <Label htmlFor="weeklyBudget">Weekly Budget ($)</Label>
        <Input
          id="weeklyBudget"
          type="number"
          min={0}
          value={budget || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
            setBudget(value);
            if (onChange) {
              onChange({
                channel,
                budget: value,
                notes
              });
            }
          }}
        />
      </div>
      
      {/* Notes field with proper spacing */}
      <div className="space-y-2">
        <Label htmlFor="marketingNotes">Additional details about this marketing channel</Label>
        <Textarea
          id="marketingNotes"
          placeholder="Add notes about this marketing channel..."
          value={notes}
          onChange={handleNotesChange}
          className="h-24"
        />
      </div>
    </div>
  );
} 