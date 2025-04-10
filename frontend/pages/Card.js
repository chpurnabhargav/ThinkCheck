import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';


const CardPage = () => {
  return (
    <div className="container">
      <Card className="my-4">
        <CardHeader>
          <CardTitle>This is a card title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the content inside the card. You can add more details here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CardPage;
