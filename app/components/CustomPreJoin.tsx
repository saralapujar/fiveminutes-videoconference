import React from 'react';
import { PreJoin as LiveKitPreJoin, PreJoinProps } from '@livekit/components-react';

interface CustomPreJoinProps extends PreJoinProps {
  username: string;
}

export function CustomPreJoin({ username, ...props }: CustomPreJoinProps) {
  return (
    <LiveKitPreJoin
      {...props}
      defaults={{
        ...props.defaults,
        username,
      }}
      onSubmit={(values) => {
        if (props.onSubmit) {
          props.onSubmit({ ...values, username });
        }
      }}
    />
  );
}

