import React from 'react';
import { ReactComponent as NameSVG } from './name.svg';
import './AnimatedName.css';

export default function AnimatedName() {
    return (
        <div className="animated-name">
            <NameSVG
            className="drawing-name"
            style={{ width: '115px', height: 'auto' }}
            />
    </div>
  );
}