import React from 'react';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onClick,
  size = 'middle',
  className = '',
}) => {
  return (
    <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
      <Button
        type="text"
        shape="circle"
        size={size}
        className={`favorite-btn ${className} ${isFavorite ? 'is-favorite' : ''}`}
        onClick={onClick}
        style={{
          color: isFavorite ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)',
          transition: 'all 0.3s',
        }}
        icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
      />
    </Tooltip>
  );
};

export default FavoriteButton; 