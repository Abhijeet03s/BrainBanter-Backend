import 'module-alias/register';
import { addAliases } from 'module-alias';
import path from 'path';

// Register path aliases
addAliases({
   '@': path.join(__dirname, './')
}); 