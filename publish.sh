DIR=$(cd `dirname $0`; pwd)

FILE="$DIR/generated/index.d.ts"
GENERATED="$DIR/generated"

if [ -f "$FILE" ]
then
    echo "$FILE found."
else 
    echo "$FILE not found."
    exit 1
fi

echo "Ready to login"

npm set registry $REGISTRY

npm-cli-login -u $USERNAME -p $PASSWORD -e $EMAIL -r $REGISTRY

echo "Logged in"

echo "Ready to publish"

npm publish --registry=$REGISTRY $GENERATED