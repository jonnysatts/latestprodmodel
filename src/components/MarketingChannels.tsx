<div className="marketing-channels relative">
  <div className="z-50 relative">
    <Select
      value={channel}
      onValueChange={handleChannelChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select marketing channel" />
      </SelectTrigger>
      <SelectContent className="z-50 bg-white">
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
  
  <div className="mt-4">
    <Label htmlFor="weeklyBudget">Weekly Budget ($)</Label>
    <Input
      id="weeklyBudget"
      type="number"
      min={0}
      value={budget || ''}
      onChange={(e) => {
        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
        setBudget(value);
      }}
    />
  </div>
</div> 