import { Injectable } from '@nestjs/common';
import { TokenModel } from './token.model';

@Injectable()
export class TokenService {

    // Token Structure: { tokenString: string, validity: Date, role: string }

    private tokens: TokenModel[] = [];

    createToken(role: string, validityLength: number) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let tokenArray = [];
        let tokenString: string;

        for(let i = 0; i < 20; i++) {
            tokenArray.push(characters[Math.floor(Math.random() * characters.length)]);
        }

        tokenString = tokenArray.join('');

        const validity = new Date();
        validity.setMinutes(validity.getMinutes() + validityLength);

        let token = { 
            tokenString: tokenString,
            validity: validity,
            role: role
        }
        
        if (this.doesExist(token.tokenString)) {
            token = this.createToken(role, validityLength);
            return token;
        }
        else {
            this.tokens.push(token);
            return token;
        }
    }

    isValid(tokenString: string) {
        this.removeInvalid();
        
        if (this.doesExist(tokenString)) {
            const token = this.tokens.find(currentToken => currentToken.tokenString == tokenString);
            if (token.validity > new Date()) {
                return true;
            }
        }
        return false;
    }

    removeInvalid() {
        for(let i = 0; i < this.tokens.length; i++) {
            const thisToken = this.tokens[i];
            if (thisToken.validity < new Date()) {
                this.tokens.splice(i, 1);
                i--;
            }
        }
    }

    doesExist(tokenString: string) {
        this.removeInvalid();
        
        let exists = false;
        
        this.tokens.forEach((currentToken) => {
            if (tokenString == currentToken.tokenString) {
                exists = true;
            }
        })
        return exists;
    }

    getTokens() {
        this.removeInvalid();

        return this.tokens;
    }

    getRole(tokenString: string) {
        if (this.isValid(tokenString)) {
            for (let i = 0; i < this.tokens.length; i++) {
                if (tokenString == this.tokens[i].tokenString) {
                    return this.tokens[i].role;
                }
            }
        }
        return '';
    }

    deleteToken(tokenString: string) {
        if (this.doesExist(tokenString)) {
            for (let i = 0; i < this.tokens.length; i++) {
                if (tokenString == this.tokens[i].tokenString) {
                    this.tokens.splice(i, 1);
                    break;
                }
            }
        }
    }
}
