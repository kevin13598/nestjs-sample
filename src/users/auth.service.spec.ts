import { Test } from "@nestjs/testing";
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users : User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter(user => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) =>  {
        const user = {id: Math.floor(Math.random() * 999999), email, password} as User;
        users.push(user);
        return Promise.resolve(user);
      }
    }
  
    const module = await Test.createTestingModule({
      providers: [
        AuthService, 
        {
          provide: UsersService, 
          useValue: fakeUsersService
        }
      ]
    }).compile();
  
    service = module.get(AuthService);
  });
  
  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('sadf@fdas.com', 'sadf');

    expect(user.password).not.toEqual('sadf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in user use', async () => {
    await service.signup('asdf@asdf.com', 'asdf');
    try {
      await service.signup('sadf@fdas.com', 'asdf');
    } catch(err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toBe('email in use');
    }
  });

  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signin('asdfas@asdfa.com', 'pasasdfasf');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toBe('user not found');
    }
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('asdfas@aesdfasd.com', '123421432');
    try {
      await service.signin('asdfas@aesdfasd.com', 'password');
    } catch(err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toBe('bad password');
    }
  });

  it('returns a user if correct password is provided', async() => {
    await service.signup('asdfas.sdafas.com', 'mypassword');

    const user =  await service.signin('asdfas.sdafas.com', 'mypassword');
    expect(user).toBeDefined();
  })
});
  