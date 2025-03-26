import React, { useState, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, X, Check } from 'lucide-react';
import type { ProductInfo } from '../types';
import useStore from '../store/useStore';

interface ProductHeaderProps {
  info: ProductInfo;
}

export default function ProductHeader({ info }: ProductHeaderProps) {
  const { updateProduct } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState<ProductInfo>(info);

  const handleLogoUpload = useCallback((event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedInfo((prev: ProductInfo) => ({
          ...prev,
          logo: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = () => {
    updateProduct(info.id, { info: editedInfo });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo(info);
    setIsEditing(false);
  };

  return (
    <div>
      {!isEditing ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {info.logo && (
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    <img src={info.logo} alt={info.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{info.name}</h1>
                  <p className="text-gray-500 mt-1">{info.type}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Details</Button>
            </div>
            <div className="mt-4">
              <p className="text-gray-700">{info.description}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="relative w-16 h-16">
                    {editedInfo.logo ? (
                      <img
                        src={editedInfo.logo}
                        alt="Product logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-2 -right-2"
                      onClick={() => document.getElementById('logo')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-grow space-y-4">
                  <div>
                    <Input
                      value={editedInfo.name}
                      onChange={(e: any) => setEditedInfo((prev: ProductInfo) => ({ ...prev, name: e.target.value }))}
                      placeholder="Product Name"
                      className="text-xl font-bold"
                    />
                  </div>
                  
                  <div>
                    <Select
                      value={editedInfo.type}
                      onValueChange={(value) => setEditedInfo((prev: ProductInfo) => ({ ...prev, type: value as ProductInfo['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Experiential Events">Experiential Events</SelectItem>
                        <SelectItem value="Venue-Based Activations">Venue-Based Activations</SelectItem>
                        <SelectItem value="Food & Beverage Products">Food & Beverage Products</SelectItem>
                        <SelectItem value="Merchandise Drops">Merchandise Drops</SelectItem>
                        <SelectItem value="Digital Products">Digital Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Textarea
                      value={editedInfo.description || ''}
                      onChange={(e: any) => setEditedInfo((prev: ProductInfo) => ({ ...prev, description: e.target.value }))}
                      placeholder="Product Description"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}