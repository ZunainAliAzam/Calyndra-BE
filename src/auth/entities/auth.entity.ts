import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    token: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;
}